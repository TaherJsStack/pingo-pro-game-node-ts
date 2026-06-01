import mongoose, { Schema } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { IPricing } from './interfaces/pricing.interface';

const pricingSchema: Schema<IPricing> = new Schema<IPricing>({
    ownerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
    brancheId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Branche', required: true },
    createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
    title:        { type: String,  required: true },
    price:        { type: Number,  required: true, min: 0 },
    type:         { type: String,  required: true },
    activeState:  { type: Boolean, default: true },
    createdAt:    { type: Date,    default: Date.now },
    description:  { type: String,  default: ''},
}, {
    timestamps: true
});

pricingSchema.plugin(uniqueValidator);
export default mongoose.model<IPricing>('Pricing', pricingSchema);
