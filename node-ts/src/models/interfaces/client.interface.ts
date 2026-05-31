import { ActivityFields, BaseEntity, ObjectId } from './common.interface';

export interface IClient extends BaseEntity, ActivityFields {
  ownerId: ObjectId;
  brancheId: ObjectId;
  createdBy: ObjectId;
  name: string;
  phone: string;
}
