import { ActivityFields, BaseEntity, ObjectId } from './common.interface';

export interface ICategory extends BaseEntity, ActivityFields {
  ownerId: ObjectId;
  tenantId?: ObjectId | null;
  brancheId: ObjectId;
  createdBy: ObjectId;
  category: string;
  price: number;
  type: string;
  logo: string;
  bookState: boolean;
}
