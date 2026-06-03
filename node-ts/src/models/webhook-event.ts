import mongoose, { Schema } from 'mongoose';
import { PaymentProvider } from '../enums';
import { IWebhookEvent } from './interfaces/webhook-event.interface';

const webhookEventSchema: Schema<IWebhookEvent> = new Schema<IWebhookEvent>({
  activeState: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  description: { type: String, default: '' },

  provider: { type: String, enum: Object.values(PaymentProvider), required: true },
  providerEventId: { type: String, required: true, unique: true, trim: true },
  eventType: { type: String, required: true, trim: true },
  payload: { type: Schema.Types.Mixed, required: true },
  status: { type: String, enum: ['received', 'processed', 'failed'], default: 'received' },
  error: { type: String, trim: true },
  receivedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
}, {
  timestamps: true,
});

webhookEventSchema.index({ providerEventId: 1 }, { unique: true });
webhookEventSchema.index({ provider: 1, status: 1 });

export default mongoose.model<IWebhookEvent>('WebhookEvent', webhookEventSchema);
