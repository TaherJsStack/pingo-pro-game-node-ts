import { ActivityFields, BaseEntity, ObjectId } from './common.interface';
import { SubscriptionStatus } from '../../enums/subscription-status.enum';
import { PaymentMethod, PaymentProvider } from '../../enums';

export interface ISubscription extends BaseEntity, ActivityFields {
  userId: ObjectId;
  plan?: ObjectId | null;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  trial: boolean;
  provider?: PaymentProvider;
  method?: PaymentMethod;
  currency: string;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  nextBillingDate?: Date;
  currentPeriodEnd?: Date;
  lastPaymentId?: ObjectId | null;
  paymentInstrumentId?: ObjectId | null;
  providerSubscriptionId?: string;
  failedAttempts: number;
  gracePeriodEnd?: Date;
}
