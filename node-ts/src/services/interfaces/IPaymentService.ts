import { Request } from 'express';
import { PaymentMethod, PaymentProvider } from '../../enums';
import { IPayment } from '../../models/interfaces/payment.interface';
import { CheckoutSession } from './IPaymentProvider';

export interface InitiatePaymentCommand {
  userId: string;
  planId: string;
  provider: PaymentProvider;
  method: PaymentMethod;
  idempotencyKey?: string;
}

export interface RecordWebhookResult {
  stored: boolean;
  webhookEventId?: string;
}

export interface IPaymentService {
  initiate(command: InitiatePaymentCommand): Promise<CheckoutSession & { paymentId: string }>;
  recordWebhook(provider: PaymentProvider, req: Request): Promise<RecordWebhookResult>;
  processWebhookEvent(eventId: string): Promise<void>;
  listUserPayments(userId: string): Promise<IPayment[]>;
  getPayment(paymentId: string, userId?: string): Promise<IPayment | null>;
}
