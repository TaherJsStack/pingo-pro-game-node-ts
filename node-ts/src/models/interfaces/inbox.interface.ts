import { ActivityFields, BaseEntity, ObjectId } from './common.interface';
import { InboxType } from '../../enums/inbox-type.enum';

export interface IInbox extends BaseEntity, ActivityFields {
  ownerId: ObjectId;
  tenantId?: ObjectId | null;
  title: string;
  type: InboxType;
  context: string;
  isSeen: boolean;
}
