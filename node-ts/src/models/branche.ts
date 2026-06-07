import mongoose, { Schema } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { IBranche } from './interfaces/branche.interface';

const brancheSchema: Schema<IBranche> = new Schema<IBranche>({
    ownerId: { type: Schema.Types.ObjectId, ref: 'Auth', required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    branche: { type: String, required: true, trim: true },
    logo: { type: String, default: '' },
    address: { type: String, default: '' },
    description: { type: String, default: '' },
    activeState: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
}, {
    timestamps: true
});

brancheSchema.plugin(uniqueValidator);
brancheSchema.index({ tenantId: 1, branche: 1 }, { unique: true });

export default mongoose.model<IBranche>('Branche', brancheSchema);
