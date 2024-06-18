import mongoose, { Document, Schema } from 'mongoose';
// import uniqueValidator from 'mongoose-unique-validator';
import { ISubscription } from './interfaces/subscription.interface';



const subscriptionSchema: Schema<ISubscription> = new Schema<ISubscription>({
    ownerId: { type: String, required: true },
    state: { type: String, required: true },
    type: { type: String, required: true },
    activeState: { type: Boolean, default: true },
    createdAt: { type: Date, default: new Date() },
    description: { type: String, default: '' },

    userId: { type: String, required: true },
    plan: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive', 'canceled'], default: 'inactive' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    trial: { type: Boolean, default: false },
}, {
    timestamps: true
});

// subscriptionSchema.plugin(uniqueValidator);

export default mongoose.model<ISubscription>('Subscription', subscriptionSchema);