import { ActivityFields, BaseEntity, ObjectId } from './common.interface';

export interface IInbox extends BaseEntity, ActivityFields {
  ownerId: ObjectId;
  title: string;
  type: 'welcom' | 'notification' | 'support' | 'system';
  context: string;
  isSeen: boolean;
}
