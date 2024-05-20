import mongoose, { Document, Schema } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

interface ISubscription extends Document {
    ownerId: string;
    state: string;
    type: string;
    activeState: boolean;
    createdAt: Date;
    description: string;
}

const subscriptionSchema: Schema<ISubscription> = new Schema({
    ownerId: { type: String, required: true },
    state: { type: String, required: true },
    type: { type: String, required: true },
    activeState: { type: Boolean, default: true },
    createdAt: { type: Date, default: new Date() },
    description: { type: String, default: '' },
}, {
    timestamps: true
});

subscriptionSchema.plugin(uniqueValidator);

export default mongoose.model<ISubscription>('Subscription', subscriptionSchema);