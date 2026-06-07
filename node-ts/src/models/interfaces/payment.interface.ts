import { PaymentMethod, PaymentProvider, PaymentStatus } from '../../enums';
import { ActivityFields, BaseEntity, ObjectId } from './common.interface';

export interface IPayment extends BaseEntity, ActivityFields {
  userId: ObjectId;
  tenantId?: ObjectId | null;
  subscriptionId?: ObjectId | null;
  planId?: ObjectId | null;
  provider: PaymentProvider;
  method: PaymentMethod;
  amountMinor: number;
  currency: string;
  status: PaymentStatus;
  providerOrderId?: string;
  providerTransactionId?: string;
  providerEventId?: string;
  idempotencyKey?: string;
  rawCallback?: unknown;
  failureReason?: string;
  refundedAmountMinor?: number;
}
