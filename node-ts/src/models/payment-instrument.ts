import mongoose, { Schema } from 'mongoose';
import { PaymentMethod, PaymentProvider } from '../enums';
import { IPaymentInstrument } from './interfaces/payment-instrument.interface';

const paymentInstrumentSchema: Schema<IPaymentInstrument> = new Schema<IPaymentInstrument>({
  activeState: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  description: { type: String, default: '' },

  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
  provider: { type: String, enum: Object.values(PaymentProvider), required: true },
  method: { type: String, enum: Object.values(PaymentMethod), required: true },
  token: { type: String, trim: true },
  brand: { type: String, trim: true },
  last4: { type: String, trim: true, maxlength: 4 },
  expMonth: { type: Number, min: 1, max: 12 },
  expYear: { type: Number, min: 2000 },
  providerSubscriptionId: { type: String, trim: true },
  isDefault: { type: Boolean, default: false },
}, {
  timestamps: true,
});

paymentInstrumentSchema.index({ userId: 1, provider: 1, method: 1 });
paymentInstrumentSchema.index({ providerSubscriptionId: 1 }, { sparse: true });

export default mongoose.model<IPaymentInstrument>('PaymentInstrument', paymentInstrumentSchema);
