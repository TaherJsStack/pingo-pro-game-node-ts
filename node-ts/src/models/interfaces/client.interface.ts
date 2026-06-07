import { ActivityFields, BaseEntity, ObjectId } from './common.interface';

export interface IClient extends BaseEntity, ActivityFields {
  ownerId: ObjectId;
  tenantId?: ObjectId | null;
  brancheId: ObjectId;
  createdBy: ObjectId;
  name: string;
  phone: string;
}
