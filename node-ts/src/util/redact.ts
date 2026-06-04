import { PaymentMethod, PaymentProvider, PaymentStatus } from '../enums';
import { IPayment } from '../models/interfaces/payment.interface';
import { IPaymentInstrument } from '../models/interfaces/payment-instrument.interface';
import { IWebhookEvent } from '../models/interfaces/webhook-event.interface';

/**
 * Redaction helpers. Anything returned to a browser or to a (non-debug) admin read must go
 * through one of these so provider tokens, payment keys, and raw callback payloads never leak.
 */

export interface PublicPayment {
  id: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  method: PaymentMethod;
  amountMinor: number;
  currency: string;
  planId: string | null;
  subscriptionId: string | null;
  failureReason?: string;
  refundedAmountMinor?: number;
  createdAt?: Date;
}

export function toPublicPayment(payment: IPayment): PublicPayment {
  return {
    id: String(payment._id),
    status: payment.status,
    provider: payment.provider,
    method: payment.method,
    amountMinor: payment.amountMinor,
    currency: payment.currency,
    planId: payment.planId ? String(payment.planId) : null,
    subscriptionId: payment.subscriptionId ? String(payment.subscriptionId) : null,
    failureReason: payment.failureReason,
    refundedAmountMinor: payment.refundedAmountMinor,
    createdAt: payment.createdAt,
  };
}

export interface PublicPaymentMethod {
  id: string;
  provider: PaymentProvider;
  method: PaymentMethod;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
  activeState: boolean;
}

export function toPublicPaymentMethod(instrument: IPaymentInstrument): PublicPaymentMethod {
  return {
    id: String(instrument._id),
    provider: instrument.provider,
    method: instrument.method,
    brand: instrument.brand,
    last4: instrument.last4,
    expMonth: instrument.expMonth,
    expYear: instrument.expYear,
    isDefault: Boolean(instrument.isDefault),
    activeState: instrument.activeState !== false,
  };
}

export interface PublicWebhookEvent {
  id: string;
  provider: PaymentProvider;
  providerEventId: string;
  eventType: string;
  status: string;
  error?: string;
  receivedAt?: Date;
  processedAt?: Date;
  createdAt?: Date;
}

export function toPublicWebhookEvent(event: IWebhookEvent): PublicWebhookEvent {
  return {
    id: String(event._id),
    provider: event.provider,
    providerEventId: event.providerEventId,
    eventType: event.eventType,
    status: event.status,
    error: event.error,
    receivedAt: event.receivedAt,
    processedAt: event.processedAt,
    createdAt: event.createdAt,
  };
}
