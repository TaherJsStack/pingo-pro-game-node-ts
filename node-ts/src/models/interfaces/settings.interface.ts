import { ActivityFields, BaseEntity, ObjectId } from './common.interface';

export interface ISettings extends BaseEntity, ActivityFields {
  ownerId: ObjectId;
  createdBy: ObjectId;
  theme: string;
  language: string;
}
