import { ActivityFields, BaseEntity, ObjectId } from './common.interface';
import { NotificationChannel } from '../../enums/notification-channel.enum';
import { NotificationEventType } from '../../enums/notification-event-type.enum';

export interface INotificationOutbox extends BaseEntity, ActivityFields {
  tenantId: ObjectId;
  channel: NotificationChannel;
  eventType: NotificationEventType;
  recipient: string;
  renderedMessage: string;
  payload: Record<string, any>;
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'dead_letter';
  attempts: number;
  lastError?: string | null;
  scheduledAt?: Date | null;
  sentAt?: Date | null;
}
