import { ActivityFields, BaseEntity } from './common.interface';

export interface ISubscription extends BaseEntity, ActivityFields {
  ownerId: string;
  state: string;
  type: string;
  userId: string;
  plan: string;
  status: 'active' | 'inactive' | 'canceled';
  startDate: Date;
  endDate: Date;
  trial: boolean;
}
