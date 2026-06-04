import crypto from 'crypto';
import { Request } from 'express';
import { paymentsConfig } from '../../config/payments';
import { PaymentMethod, PaymentProvider, PaymentStatus } from '../../enums';
import { UnsupportedRecurringError, ValidationError } from '../../errors/AppError';
import {
  CheckoutSession,
  InitiateCheckoutInput,
  IPaymentProvider,
  NormalizedPaymentEvent,
  VerifiedWebhook,
} from '../../services/interfaces/IPaymentProvider';
import { IPaymentInstrument } from '../../models/interfaces/payment-instrument.interface';

const HMAC_FIELDS = [
  'amount_cents',
  'created_at',
  'currency',
  'error_occured',
  'has_parent_transaction',
  'id',
  'integration_id',
  'is_3d_secure',
  'is_auth',
  'is_capture',
  'is_refunded',
  'is_standalone_payment',
  'is_voided',
  'order.id',
  'owner',
  'pending',
  'source_data.pan',
  'source_data.sub_type',
  'source_data.type',
  'success',
];

function rawBody(req: Request): string {
  if (Buffer.isBuffer(req.body)) {
    return req.body.toString('utf8');
  }
  return JSON.stringify(req.body ?? {});
}

function nestedValue(payload: any, path: string): string {
  const value = path.split('.').reduce((current, key) => current?.[key], payload);
  if (value === null || typeof value === 'undefined') {
    return '';
  }
  return String(value);
}

export function verifyPaymobHmac(payload: any, receivedHmac: string, secret: string): boolean {
  if (!receivedHmac || !secret) {
    return false;
  }

  const base = HMAC_FIELDS.map((field) => nestedValue(payload.obj ?? payload, field)).join('');
  const expected = crypto.createHmac('sha512', secret).update(base).digest('hex');
  const expectedBytes = Buffer.from(expected, 'hex');
  const receivedBytes = Buffer.from(receivedHmac, 'hex');

  return expectedBytes.length === receivedBytes.length && crypto.timingSafeEqual(expectedBytes, receivedBytes);
}

export function normalizePaymobWebhook(payload: any): NormalizedPaymentEvent {
  const obj = payload.obj ?? payload;
  const success = obj.success === true || obj.success === 'true';
  const refunded = obj.is_refunded === true || obj.is_refunded === 'true';
  const canceled = obj.is_voided === true || obj.is_voided === 'true';
  const providerTransactionId = obj.id ? String(obj.id) : undefined;
  const providerOrderId = obj.order?.id ? String(obj.order.id) : obj.order ? String(obj.order) : undefined;
  const providerEventId = payload.id ? String(payload.id) : providerTransactionId ?? providerOrderId ?? crypto.randomUUID();

  let status = PaymentStatus.Failed;
  if (refunded) {
    status = PaymentStatus.Refunded;
  } else if (canceled) {
    status = PaymentStatus.Canceled;
  } else if (success) {
    status = PaymentStatus.Paid;
  }

  return {
    type: String(payload.type ?? obj.type ?? 'paymob.transaction'),
    provider: PaymentProvider.Paymob,
    providerEventId,
    providerOrderId,
    providerTransactionId,
    status,
    amountMinor: Number(obj.amount_cents ?? 0),
    currency: String(obj.currency ?? 'EGP').toUpperCase(),
    cardToken: obj.token ?? obj.card_token,
    occurredAt: obj.created_at ? new Date(obj.created_at) : new Date(),
    raw: payload,
  };
}

function walletMethods(method: PaymentMethod): boolean {
  return [PaymentMethod.VodafoneCash, PaymentMethod.EtisalatCash, PaymentMethod.OrangeCash].includes(method);
}

export class PaymobProvider implements IPaymentProvider {
  private readonly config = paymentsConfig.paymob;

  async initiateCheckout(input: InitiateCheckoutInput): Promise<CheckoutSession> {
    this.assertEnabled();
    const authToken = await this.getAuthToken();
    const order = await this.createOrder(authToken, input);
    const paymentKey = await this.createPaymentKey(authToken, order.id, input);

    if (walletMethods(input.method)) {
      const walletPhone = input.metadata?.phone;
      if (!walletPhone) {
        throw new ValidationError('A wallet phone number is required for Paymob wallet payments.');
      }
      const redirectUrl = await this.payWithWallet(paymentKey, walletPhone);
      return {
        provider: PaymentProvider.Paymob,
        providerOrderId: String(order.id),
        redirectUrl,
        // No paymentKey/token returned to the browser for wallet flows; the customer either
        // follows the redirect or confirms on their phone while the page polls for the webhook.
        clientPayload: {
          orderId: order.id,
          method: input.method,
        },
      };
    }

    return {
      provider: PaymentProvider.Paymob,
      providerOrderId: String(order.id),
      iframeUrl: `${this.config.baseUrl}/acceptance/iframes/${this.config.iframeId}?payment_token=${paymentKey}`,
      clientPayload: {
        paymentKey,
        orderId: order.id,
      },
    };
  }

  async verifyWebhook(req: Request): Promise<VerifiedWebhook> {
    this.assertEnabled();
    const payload = JSON.parse(rawBody(req));
    const receivedHmac = String(req.query.hmac ?? payload.hmac ?? '');
    const valid = verifyPaymobHmac(payload, receivedHmac, this.config.hmacSecret);

    return {
      valid,
      event: normalizePaymobWebhook(payload),
    };
  }

  async chargeSavedToken(
    instrument: IPaymentInstrument,
    amountMinor: number,
    currency: string,
    meta: Record<string, string>
  ): Promise<NormalizedPaymentEvent> {
    this.assertEnabled();
    if (walletMethods(instrument.method)) {
      throw new UnsupportedRecurringError('Paymob wallet payments require customer confirmation and cannot auto-renew.');
    }
    if (!instrument.token) {
      throw new ValidationError('Saved card token is required for recurring Paymob card charges.');
    }

    const authToken = await this.getAuthToken();
    const response = await fetch(`${this.config.baseUrl}/acceptance/payments/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: {
          identifier: instrument.token,
          subtype: 'TOKEN',
        },
        payment_token: await this.createPaymentKey(authToken, meta.orderId ?? meta.paymentId, {
          userId: String(instrument.userId),
          planId: meta.planId ?? '',
          paymentId: meta.paymentId ?? '',
          amountMinor,
          currency,
          provider: PaymentProvider.Paymob,
          method: PaymentMethod.Card,
          plan: {} as any,
        }),
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(`Paymob recurring charge failed: ${response.status}`);
    }

    return normalizePaymobWebhook(payload);
  }

  // Completes a mobile-wallet (Vodafone/Etisalat/Orange Cash) payment. Paymob returns a
  // redirect/iframe URL the customer uses to authorize the wallet debit.
  private async payWithWallet(paymentToken: string, phone: string): Promise<string | undefined> {
    const response = await fetch(`${this.config.baseUrl}/acceptance/payments/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: { identifier: phone, subtype: 'WALLET' },
        payment_token: paymentToken,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(`Paymob wallet payment failed: ${response.status}`);
    }
    return payload.redirect_url ?? payload.redirectUrl ?? payload.iframe_redirection_url ?? undefined;
  }

  private async getAuthToken(): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/auth/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: this.config.apiKey }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.token) {
      throw new Error(`Paymob auth failed: ${response.status}`);
    }
    return payload.token;
  }

  private assertEnabled(): void {
    if (!paymentsConfig.enabled) {
      throw new ValidationError('Payments are disabled. Set PAYMENTS_ENABLED=true and provide Paymob credentials.');
    }
  }

  private async createOrder(authToken: string, input: InitiateCheckoutInput): Promise<{ id: number | string }> {
    const response = await fetch(`${this.config.baseUrl}/ecommerce/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: input.amountMinor,
        currency: input.currency,
        merchant_order_id: input.paymentId,
        items: [],
      }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.id) {
      throw new Error(`Paymob order creation failed: ${response.status}`);
    }
    return payload;
  }

  private async createPaymentKey(
    authToken: string,
    orderId: string | number,
    input: InitiateCheckoutInput
  ): Promise<string> {
    const integrationId = walletMethods(input.method)
      ? this.config.integrationIds.wallet
      : this.config.integrationIds.card;

    const response = await fetch(`${this.config.baseUrl}/acceptance/payment_keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: authToken,
        amount_cents: input.amountMinor,
        expiration: 3600,
        order_id: orderId,
        billing_data: {
          apartment: 'NA',
          email: input.metadata?.email ?? 'customer@example.com',
          floor: 'NA',
          first_name: input.metadata?.firstName ?? 'Pingo',
          street: 'NA',
          building: 'NA',
          phone_number: input.metadata?.phone ?? '01000000000',
          shipping_method: 'NA',
          postal_code: 'NA',
          city: 'Cairo',
          country: 'EG',
          last_name: input.metadata?.lastName ?? 'Customer',
          state: 'NA',
        },
        currency: input.currency,
        integration_id: integrationId,
        lock_order_when_paid: true,
        save_card: input.method === PaymentMethod.Card,
      }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.token) {
      throw new Error(`Paymob payment key creation failed: ${response.status}`);
    }
    return payload.token;
  }
}
