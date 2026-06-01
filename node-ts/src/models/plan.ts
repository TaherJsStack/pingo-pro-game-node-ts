import mongoose, { Schema } from 'mongoose';
import { IPlan } from './interfaces/plan.interface';


const PlanSchema: Schema<IPlan> = new Schema<IPlan>({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  durationMonths: { type: Number, required: true, min: 0 },
  activeState: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  description: { type: String, default: '' },
}, {
  timestamps: true,
});

const Plan = mongoose.model<IPlan>('Plan', PlanSchema);

export default Plan;
