import mongoose, { Schema } from 'mongoose';
import { INotificationOutbox } from './interfaces/notification-outbox.interface';
import { NotificationChannel } from '../enums/notification-channel.enum';
import { NotificationEventType } from '../enums/notification-event-type.enum';

const notificationOutboxSchema: Schema<INotificationOutbox> = new Schema<INotificationOutbox>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  channel: { type: String, enum: Object.values(NotificationChannel), required: true },
  eventType: { type: String, enum: Object.values(NotificationEventType), required: true },
  recipient: { type: String, required: true },
  renderedMessage: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ['pending', 'sending', 'sent', 'failed', 'dead_letter'], default: 'pending', index: true },
  attempts: { type: Number, default: 0 },
  lastError: { type: String, default: null },
  scheduledAt: { type: Date, default: Date.now, index: true },
  sentAt: { type: Date, default: null },
  activeState: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  description: { type: String, default: '' },
}, {
  timestamps: true,
});

notificationOutboxSchema.index({ status: 1, scheduledAt: 1 });
notificationOutboxSchema.index({ tenantId: 1, createdAt: -1 });

const NotificationOutbox = mongoose.model<INotificationOutbox>('NotificationOutbox', notificationOutboxSchema);

export default NotificationOutbox;
