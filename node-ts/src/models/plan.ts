import mongoose, { Schema } from 'mongoose';
import { IPlan } from './interfaces/plan.interface';
import { toMinor } from '../util/money';


const PlanSchema: Schema<IPlan> = new Schema<IPlan>({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  durationMonths: { type: Number, required: true, min: 0 },
  amountMinor: { type: Number, min: 0 },
  currency: { type: String, default: 'EGP', uppercase: true, trim: true },
  billingIntervalMonths: { type: Number, min: 1 },
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
  next();
});

const Plan = mongoose.model<IPlan>('Plan', PlanSchema);

export default Plan;
