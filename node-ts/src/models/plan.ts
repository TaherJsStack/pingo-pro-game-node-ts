import mongoose, { Schema, Document } from 'mongoose';
import { IPlan } from './interfaces/plan.interface';


const PlanSchema: Schema = new Schema<IPlan>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  durationMonths: { type: Number, required: true },
});

const Plan = mongoose.model<IPlan>('Plan', PlanSchema);

export default Plan;
