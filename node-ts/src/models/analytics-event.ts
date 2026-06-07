import mongoose, { Schema } from 'mongoose';
import { IAnalyticsEvent } from './interfaces/analytics-event.interface';

const analyticsEventSchema: Schema<IAnalyticsEvent> = new Schema<IAnalyticsEvent>(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    brancheId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branche', required: true, index: true },
    shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', default: null, index: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', default: null, index: true },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null, index: true },
    deviceType: { type: String, required: true, trim: true, index: true },
    eventType: { type: String, required: true, trim: true, index: true },
    amount: { type: Number, required: true, default: 0 },
    occurredAt: { type: Date, required: true, default: Date.now, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    activeState: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    description: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

analyticsEventSchema.index({ tenantId: 1, occurredAt: -1 });
analyticsEventSchema.index({ tenantId: 1, brancheId: 1, eventType: 1, occurredAt: -1 });
analyticsEventSchema.index({ tenantId: 1, brancheId: 1, deviceType: 1, occurredAt: -1 });

export default mongoose.model<IAnalyticsEvent>('AnalyticsEvent', analyticsEventSchema);
