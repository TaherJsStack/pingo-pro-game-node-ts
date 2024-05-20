import mongoose, { Schema, Document } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

export interface IPricing extends Document {
    brancheId: mongoose.Schema.Types.ObjectId;
    ownerId: mongoose.Schema.Types.ObjectId;
    title: string;
    price: number;
    type: string;
    activeState: boolean;
    createdAt: Date;
    description: string;
}

const pricingSchema: Schema<IPricing> = new Schema({
    brancheId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Branche', required: true },
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