import { ActivityFields, BaseEntity, ObjectId } from './common.interface';

export interface ISubscription extends BaseEntity, ActivityFields {
  userId: ObjectId;
  plan?: ObjectId | null;
  status: 'active' | 'inactive' | 'canceled';
  startDate: Date;
  endDate: Date;
  trial: boolean;
}
