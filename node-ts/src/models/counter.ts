import mongoose, { Schema } from 'mongoose';
import { ICounter } from './interfaces/counter.interface';

const counterSchema: Schema<ICounter> = new Schema<ICounter>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    brancheId: { type: Schema.Types.ObjectId, ref: 'Branche', required: true },
    scope: { type: String, required: true, trim: true },
    sequence: { type: Number, default: 0, min: 0 },
    activeState: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    description: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

counterSchema.index({ tenantId: 1, brancheId: 1, scope: 1 }, { unique: true });

export default mongoose.model<ICounter>('Counter', counterSchema);
