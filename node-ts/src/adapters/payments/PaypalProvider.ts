import { Request } from 'express';
import { paymentsConfig } from '../../config/payments';
import { PaymentProvider, PaymentStatus } from '../../enums';
import { ValidationError } from '../../errors/AppError';
import {
  CheckoutSession,
  InitiateCheckoutInput,
  IPaymentProvider,
  NormalizedPaymentEvent,
  ProviderSubscriptionResult,
  VerifiedWebhook,
} from '../../services/interfaces/IPaymentProvider';
import { IPlan } from '../../models/interfaces/plan.interface';

function rawBody(req: Request): string {
  if (Buffer.isBuffer(req.body)) {
    return req.body.toString('utf8');
  }
  return JSON.stringify(req.body ?? {});
}

export function normalizePaypalEvent(payload: any): NormalizedPaymentEvent {
  const eventType = String(payload.event_type ?? 'paypal.event');
  const resource = payload.resource ?? {};
  const amount = resource.amount ?? resource.billing_info?.last_payment?.amount;
  const statusMap: Record<string, PaymentStatus> = {
    'BILLING.SUBSCRIPTION.ACTIVATED': PaymentStatus.Paid,
    'PAYMENT.SALE.COMPLETED': PaymentStatus.Paid,
    'CHECKOUT.ORDER.APPROVED': PaymentStatus.Paid,
    'BILLING.SUBSCRIPTION.CANCELLED': PaymentStatus.Canceled,
    'PAYMENT.SALE.DENIED': PaymentStatus.Failed,
    'PAYMENT.SALE.REVERSED': PaymentStatus.Refunded,
  };

  return {
    type: eventType,
    provider: PaymentProvider.Paypal,
    providerEventId: String(payload.id ?? resource.id),
    providerOrderId: resource.parent_payment ?? resource.billing_agreement_id ?? resource.id,
    providerTransactionId: resource.id ? String(resource.id) : undefined,
    subscriptionId: resource.billing_agreement_id ?? resource.id,
    status: statusMap[eventType] ?? PaymentStatus.Pending,
    amountMinor: amount?.value ? Math.round(Number(amount.value) * 100) : undefined,
    currency: amount?.currency_code ?? amount?.currency,
    occurredAt: payload.create_time ? new Date(payload.create_time) : new Date(),
    raw: payload,
  };
}

export class PaypalProvider implements IPaymentProvider {
  private readonly config = paymentsConfig.paypal;
  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0;

  async initiateCheckout(input: InitiateCheckoutInput): Promise<CheckoutSession> {
    this.assertEnabled();
    const subscription = await this.createSubscription(input.plan);

    return {
      provider: PaymentProvider.Paypal,
      providerOrderId: subscription.providerSubscriptionId,
      redirectUrl: subscription.approveUrl,
      clientPayload: {
        providerSubscriptionId: subscription.providerSubscriptionId,
      },
    };
  }

  async verifyWebhook(req: Request): Promise<VerifiedWebhook> {
    this.assertEnabled();
    const payload = JSON.parse(rawBody(req));
    const accessToken = await this.getAccessToken();
    const response = await fetch(`${this.baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: req.header('paypal-auth-algo'),
        cert_url: req.header('paypal-cert-url'),
        transmission_id: req.header('paypal-transmission-id'),
        transmission_sig: req.header('paypal-transmission-sig'),
        transmission_time: req.header('paypal-transmission-time'),
        webhook_id: this.config.webhookId,
        webhook_event: payload,
      }),
    });
    const verification = await response.json();

    return {
      valid: response.ok && verification.verification_status === 'SUCCESS',
      event: normalizePaypalEvent(payload),
    };
  }

  async createProviderSubscription(plan: IPlan): Promise<ProviderSubscriptionResult> {
    this.assertEnabled();
    return this.createSubscription(plan);
  }

  async cancelProviderSubscription(providerSubscriptionId: string): Promise<void> {
    this.assertEnabled();
    const accessToken = await this.getAccessToken();
    const response = await fetch(`${this.baseUrl}/v1/billing/subscriptions/${providerSubscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: 'Canceled by merchant request' }),
    });
    if (!response.ok) {
      throw new Error(`PayPal subscription cancel failed: ${response.status}`);
    }
  }

  private get baseUrl(): string {
    return this.config.mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  }

  private assertEnabled(): void {
    if (!paymentsConfig.enabled) {
      throw new ValidationError('Payments are disabled. Set PAYMENTS_ENABLED=true and provide PayPal credentials.');
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.accessTokenExpiresAt) {
      return this.accessToken;
    }

    const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    const payload = await response.json();
    if (!response.ok || !payload.access_token) {
      throw new Error(`PayPal auth failed: ${response.status}`);
    }

    this.accessToken = String(payload.access_token);
    this.accessTokenExpiresAt = Date.now() + Math.max(Number(payload.expires_in ?? 300) - 60, 60) * 1000;
    return this.accessToken;
  }

  private async createSubscription(plan: IPlan): Promise<ProviderSubscriptionResult> {
    const paypalPlanId = plan.externalIds?.paypalPlanId;
    if (!paypalPlanId) {
      throw new Error('PayPal plan id is required on Plan.externalIds.paypalPlanId before initiating a PayPal subscription.');
    }

    const accessToken = await this.getAccessToken();
    const response = await fetch(`${this.baseUrl}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: paypalPlanId,
        application_context: {
          return_url: `${paymentsConfig.appBaseUrl}/api/v1/payment/paypal/return`,
          cancel_url: `${paymentsConfig.appBaseUrl}/api/v1/payment/paypal/cancel`,
          user_action: 'SUBSCRIBE_NOW',
        },
      }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.id) {
      throw new Error(`PayPal subscription creation failed: ${response.status}`);
    }

    const approveLink = (payload.links ?? []).find((link: any) => link.rel === 'approve')?.href;
    return {
      providerSubscriptionId: payload.id,
      approveUrl: approveLink,
    };
  }
}
