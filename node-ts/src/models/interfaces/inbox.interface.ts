import { ActivityFields, BaseEntity, ObjectId } from './common.interface';

export interface IInbox extends BaseEntity, ActivityFields {
  ownerId: ObjectId;
  title: string;
  type: string;
  context: string;
  isSeen: boolean;
}
