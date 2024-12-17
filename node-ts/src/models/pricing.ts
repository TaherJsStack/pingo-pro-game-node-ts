import mongoose, { Schema, Document } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { IPricing } from './interfaces/pricing.interface';

const pricingSchema: Schema<IPricing> = new Schema({
    brancheId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Branche', required: true },
    createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
    title:        { type: String,  required: true },
    price:        { type: Number,  required: true },
    type:         { type: String,  required: true },
    activeState:  { type: Boolean, default: true },
    createdAt:    { type: Date,    default: new Date() },
    description:  { type: String,  default: ''},
}, {
    timestamps: true
});

pricingSchema.plugin(uniqueValidator);
mongoose.model<IPricing>('Pricing', pricingSchema);

export default mongoose.model<IPricing>('Pricing');