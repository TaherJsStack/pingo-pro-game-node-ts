import { Request } from 'express';
import { PaymentMethod, PaymentProvider, PaymentStatus } from '../../enums';
import { IPlan } from '../../models/interfaces/plan.interface';
import { IPaymentInstrument } from '../../models/interfaces/payment-instrument.interface';

export interface InitiateCheckoutInput {
  userId: string;
  planId: string;
  paymentId: string;
  amountMinor: number;
  currency: string;
  provider: PaymentProvider;
  method: PaymentMethod;
  plan: IPlan;
  metadata?: Record<string, string>;
}

export interface CheckoutSession {
  provider: PaymentProvider;
  providerOrderId: string;
  redirectUrl?: string;
  iframeUrl?: string;
  clientPayload?: Record<string, unknown>;
}

export interface NormalizedPaymentEvent {
  type: string;
  provider: PaymentProvider;
  providerEventId: string;
  providerOrderId?: string;
  providerTransactionId?: string;
  status: PaymentStatus;
  amountMinor?: number;
  currency?: string;
  cardToken?: string;
  subscriptionId?: string;
  occurredAt: Date;
  raw: unknown;
}

export interface VerifiedWebhook {
  valid: boolean;
  event: NormalizedPaymentEvent;
}

export interface ProviderSubscriptionResult {
  providerSubscriptionId: string;
  approveUrl: string;
}

export interface IPaymentProvider {
  initiateCheckout(input: InitiateCheckoutInput): Promise<CheckoutSession>;
  verifyWebhook(req: Request): Promise<VerifiedWebhook>;
  chargeSavedToken?(
    instrument: IPaymentInstrument,
    amountMinor: number,
    currency: string,
    meta: Record<string, string>
  ): Promise<NormalizedPaymentEvent>;
  createProviderSubscription?(plan: IPlan, instrument?: IPaymentInstrument): Promise<ProviderSubscriptionResult>;
  cancelProviderSubscription?(providerSubscriptionId: string): Promise<void>;
  refund?(providerTransactionId: string, amountMinor?: number): Promise<NormalizedPaymentEvent>;
}
