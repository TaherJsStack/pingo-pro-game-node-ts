import mongoose, { Schema } from 'mongoose';
import { IPlan } from './interfaces/plan.interface';
import { toMinor } from '../util/money';

const PlanSchema: Schema<IPlan> = new Schema<IPlan>({
  code: { type: String, enum: ['free', 'quarterly', 'extended'], index: true, sparse: true },
  tier: { type: String, enum: ['basic', 'advanced'], default: 'basic' },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  durationMonths: { type: Number, required: true, min: 0 },
  amountMinor: { type: Number, min: 0 },
  currency: { type: String, default: 'EGP', uppercase: true, trim: true },
  billingIntervalMonths: { type: Number, min: 1 },
  deviceLimit: { type: Number, min: 0, default: 3 },
  featureFlags: { type: [String], default: [] },
  externalIds: {
    paypalPlanId: { type: String, trim: true },
    paypalProductId: { type: String, trim: true },
  },
  activeState: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  description: { type: String, default: '' },
}, {
  timestamps: true,
});

PlanSchema.pre('validate', function deriveBillingFields(next) {
  const plan = this as IPlan;
  plan.currency = plan.currency || 'EGP';
  plan.billingIntervalMonths = plan.billingIntervalMonths || plan.durationMonths || 1;
  plan.amountMinor = Number.isInteger(plan.amountMinor) ? plan.amountMinor : toMinor(plan.price, plan.currency);
  plan.deviceLimit = Number.isInteger(plan.deviceLimit) ? plan.deviceLimit : plan.tier === 'advanced' ? 8 : 3;
  plan.featureFlags = Array.isArray(plan.featureFlags) && plan.featureFlags.length
    ? plan.featureFlags
    : plan.tier === 'advanced'
      ? ['vip', 'package', 'priority-support']
      : ['hourly', 'receipt-printing'];
  next();
});

const Plan = mongoose.model<IPlan>('Plan', PlanSchema);

export default Plan;
