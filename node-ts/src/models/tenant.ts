import mongoose, { Schema } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { ITenant } from './interfaces/tenant.interface';

const tenantSchema: Schema<ITenant> = new Schema<ITenant>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'Auth', default: null },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    activeState: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    description: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

tenantSchema.plugin(uniqueValidator);

export default mongoose.model<ITenant>('Tenant', tenantSchema);
