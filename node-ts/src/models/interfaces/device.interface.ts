import { ActivityFields, BaseEntity, ObjectId } from './common.interface';

export interface IDevice extends BaseEntity, ActivityFields {
  ownerId: ObjectId;
  tenantId?: ObjectId | null;
  brancheId: ObjectId;
  createdBy: ObjectId;
  name: string;
  price: number;
  type: string;
  logo: string;
  bookState: boolean;
}
