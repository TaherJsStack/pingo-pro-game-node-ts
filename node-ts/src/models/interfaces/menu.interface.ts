import { ActivityFields, BaseEntity, ObjectId } from './common.interface';

export interface IMenu extends BaseEntity, ActivityFields {
  ownerId: ObjectId;
  tenantId?: ObjectId | null;
  brancheId: ObjectId;
  createdBy: ObjectId;
  name: string;
  price: number;
  type: string;
  stock: number;
  logo: string;
}
