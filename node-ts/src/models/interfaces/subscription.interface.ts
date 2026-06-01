import { ActivityFields, BaseEntity, ObjectId } from './common.interface';
import { SubscriptionStatus } from '../../enums/subscription-status.enum';

export interface ISubscription extends BaseEntity, ActivityFields {
  userId: ObjectId;
  plan?: ObjectId | null;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  trial: boolean;
}
