import { ActivityFields, BaseEntity, ObjectId } from './common.interface';

export interface IPricing extends BaseEntity, ActivityFields {
  brancheId: ObjectId;
  ownerId: ObjectId;
  createdBy: ObjectId;
  tenantId?: ObjectId | null;
  title: string;
  price: number;
  type: string;
  deviceType: string;
}
