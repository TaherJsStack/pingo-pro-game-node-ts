import mongoose, { Schema } from 'mongoose';
// import uniqueValidator from 'mongoose-unique-validator';
import { ISubscription } from './interfaces/subscription.interface';
import { PaymentMethod, PaymentProvider, SubscriptionStatus } from '../enums';

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
    provider: { type: String, enum: Object.values(PaymentProvider) },
    method: { type: String, enum: Object.values(PaymentMethod) },
    currency: { type: String, default: 'EGP', uppercase: true, trim: true },
    autoRenew: { type: Boolean, default: true },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    nextBillingDate: { type: Date },
    currentPeriodEnd: { type: Date },
    lastPaymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
    paymentInstrumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentInstrument', default: null },
    providerSubscriptionId: { type: String, trim: true },
    failedAttempts: { type: Number, default: 0, min: 0 },
    gracePeriodEnd: { type: Date },
}, {
    timestamps: true
});

subscriptionSchema.pre('validate', function syncCurrentPeriodEnd(next) {
    if (!this.currentPeriodEnd && this.endDate) {
        this.currentPeriodEnd = this.endDate;
    }
    next();
});

subscriptionSchema.index(
    { userId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            status: { $in: [SubscriptionStatus.Active, SubscriptionStatus.Trialing, SubscriptionStatus.PastDue] },
        },
    }
);
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ nextBillingDate: 1, status: 1 });

// subscriptionSchema.plugin(uniqueValidator);

export default mongoose.model<ISubscription>('Subscription', subscriptionSchema);
