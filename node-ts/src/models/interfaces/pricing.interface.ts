import { ActivityFields, BaseEntity, ObjectId } from './common.interface';

export interface IPricing extends BaseEntity, ActivityFields {
  brancheId: ObjectId;
  ownerId: ObjectId;
  createdBy: ObjectId;
  title: string;
  price: number;
  type: string;
}
