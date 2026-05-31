import { ActivityFields, BaseEntity, ObjectId } from './common.interface';

export interface ICategory extends BaseEntity, ActivityFields {
  ownerId: ObjectId;
  brancheId: ObjectId;
  createdBy: ObjectId;
  category: string;
  price: number;
  type: string;
  logo: string;
  bookState: boolean;
}
