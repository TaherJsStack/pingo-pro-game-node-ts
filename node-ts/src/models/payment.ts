import mongoose, { Schema } from 'mongoose';
import { PaymentMethod, PaymentProvider, PaymentStatus } from '../enums';
import { IPayment } from './interfaces/payment.interface';

const paymentSchema: Schema<IPayment> = new Schema<IPayment>({
  activeState: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  description: { type: String, default: '' },

  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', default: null },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null },
  provider: { type: String, enum: Object.values(PaymentProvider), required: true },
  method: { type: String, enum: Object.values(PaymentMethod), required: true },
  amountMinor: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, uppercase: true, trim: true },
  status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.Pending },
  providerOrderId: { type: String, trim: true },
  providerTransactionId: { type: String, trim: true },
  providerEventId: { type: String, trim: true, sparse: true, unique: true },
  rawCallback: { type: Schema.Types.Mixed },
  failureReason: { type: String, trim: true },
  refundedAmountMinor: { type: Number, min: 0 },
}, {
  timestamps: true,
});

paymentSchema.index({ providerEventId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ providerOrderId: 1 });

export default mongoose.model<IPayment>('Payment', paymentSchema);
