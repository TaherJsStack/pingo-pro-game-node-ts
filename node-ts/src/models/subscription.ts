import mongoose, { Schema } from 'mongoose';
// import uniqueValidator from 'mongoose-unique-validator';
import { ISubscription } from './interfaces/subscription.interface';
import { SubscriptionStatus } from '../enums/subscription-status.enum';

const subscriptionSchema: Schema<ISubscription> = new Schema<ISubscription>({
    activeState: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    description: { type: String, default: '' },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null },
    status: { type: String, enum: Object.values(SubscriptionStatus), default: SubscriptionStatus.Inactive },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    trial: { type: Boolean, default: false },
}, {
    timestamps: true
});

// subscriptionSchema.plugin(uniqueValidator);

export default mongoose.model<ISubscription>('Subscription', subscriptionSchema);
