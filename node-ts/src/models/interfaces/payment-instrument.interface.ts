import { PaymentMethod, PaymentProvider } from '../../enums';
import { ActivityFields, BaseEntity, ObjectId } from './common.interface';

export interface IPaymentInstrument extends BaseEntity, ActivityFields {
  userId: ObjectId;
  tenantId?: ObjectId | null;
  provider: PaymentProvider;
  method: PaymentMethod;
  token?: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  providerSubscriptionId?: string;
  isDefault: boolean;
}
