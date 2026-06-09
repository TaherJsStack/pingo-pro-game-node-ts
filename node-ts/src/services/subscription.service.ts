import { Types } from 'mongoose';
import { paymentProviderFactory, PaymentProviderFactory } from '../adapters/payments/PaymentProviderFactory';
import { PaymentMethod, PaymentProvider, SubscriptionStatus } from '../enums';
import { ValidationError } from '../errors/AppError';
import { IRepository } from '../repositories';
import { subscriptionRepository } from '../repositories/instances';
import { IPayment } from '../models/interfaces/payment.interface';
import { IPlan } from '../models/interfaces/plan.interface';
import { ISubscription } from '../models/interfaces/subscription.interface';
import { ISubscriptionService, SubscriptionTransitionMap } from './interfaces/ISubscriptionService';

export const subscriptionTransitions: SubscriptionTransitionMap = {
  [SubscriptionStatus.Inactive]: [SubscriptionStatus.PendingPayment, SubscriptionStatus.Trialing, SubscriptionStatus.Active],
  [SubscriptionStatus.PendingPayment]: [SubscriptionStatus.Trialing, SubscriptionStatus.Active, SubscriptionStatus.PastDue, SubscriptionStatus.Canceled, SubscriptionStatus.Expired],
  [SubscriptionStatus.Trialing]: [SubscriptionStatus.Active, SubscriptionStatus.Expired, SubscriptionStatus.Canceled],
  [SubscriptionStatus.Active]: [SubscriptionStatus.PastDue, SubscriptionStatus.Canceled, SubscriptionStatus.Expired],
  [SubscriptionStatus.PastDue]: [SubscriptionStatus.Active, SubscriptionStatus.Expired, SubscriptionStatus.Canceled],
  [SubscriptionStatus.Canceled]: [],
  [SubscriptionStatus.Expired]: [],
};

export function canTransitionSubscription(from: SubscriptionStatus, to: SubscriptionStatus): boolean {
  return from === to || subscriptionTransitions[from]?.includes(to) === true;
}

export function assertSubscriptionTransition(from: SubscriptionStatus, to: SubscriptionStatus): void {
  if (!canTransitionSubscription(from, to)) {
    throw new ValidationError(`Illegal subscription status transition from ${from} to ${to}`);
  }
}

export function addBillingMonths(date: Date, months: number): Date {
  const nextDate = new Date(date);
  nextDate.setUTCMonth(nextDate.getUTCMonth() + Math.max(Number(months) || 1, 1));
  return nextDate;
}

export function supportsRecurring(provider?: PaymentProvider, method?: PaymentMethod): boolean {
  if (provider === PaymentProvider.Paypal || method === PaymentMethod.Paypal) {
    return true;
  }
  return provider === PaymentProvider.Paymob && method === PaymentMethod.Card;
}

class SubscriptionService implements ISubscriptionService {
  constructor(
    private readonly subscriptions: IRepository<ISubscription> = subscriptionRepository,
    private readonly providers: PaymentProviderFactory = paymentProviderFactory
  ) {}

  async activateOrRenew(userId: string, plan: IPlan, payment: IPayment): Promise<ISubscription | null> {
    const existing = await this.findSubscriptionForPayment(userId, payment);

    // A late or duplicate paid event must never revive a terminal subscription, nor
    // silently create a second active one for a user who already canceled/expired.
    if (existing && (existing.status === SubscriptionStatus.Canceled || existing.status === SubscriptionStatus.Expired)) {
      return existing;
    }

    const currentStatus = existing?.status ?? SubscriptionStatus.Inactive;
    assertSubscriptionTransition(currentStatus, SubscriptionStatus.Active);

    const now = new Date();
    const baseEndDate = existing?.endDate && existing.endDate > now ? existing.endDate : now;
    const endDate = addBillingMonths(baseEndDate, plan.billingIntervalMonths || plan.durationMonths || 1);
    const recurring = supportsRecurring(payment.provider, payment.method);
    const update = {
      userId: new Types.ObjectId(userId),
      plan: plan._id,
      status: SubscriptionStatus.Active,
      startDate: existing?.startDate ?? now,
      endDate,
      currentPeriodEnd: endDate,
      trial: false,
      provider: payment.provider,
      method: payment.method,
      currency: payment.currency,
      autoRenew: existing?.autoRenew ?? true,
      cancelAtPeriodEnd: false,
      nextBillingDate: recurring ? endDate : undefined,
      lastPaymentId: payment._id,
      failedAttempts: 0,
      gracePeriodEnd: undefined,
      // For PayPal, the recurring object is the subscription id (stored as the payment's
      // providerOrderId at initiate), NOT the per-transaction sale id — cancellation targets it.
      providerSubscriptionId:
        payment.provider === PaymentProvider.Paypal
          ? payment.providerOrderId ?? existing?.providerSubscriptionId
          : payment.providerTransactionId ?? existing?.providerSubscriptionId,
    };

    if (existing?._id) {
      return this.subscriptions.findOneAndUpdate(
        { _id: existing._id, status: currentStatus },
        { $set: update },
        { new: true }
      );
    }

    return this.subscriptions.create(update as any);
  }

  async startTrial(userId: string, plan: IPlan | null, trialDays: number): Promise<ISubscription> {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setUTCDate(endDate.getUTCDate() + Math.max(trialDays, 1));

    // Only a paid plan should auto-renew at trial end. Planless registration/system
    // trials AND the free-plan trial (price 0) must NOT auto-renew — otherwise the
    // billing scheduler treats them as due renewals and flips them to PastDue instead
    // of letting the expiry sweep cleanly end them. Keeping the (free) plan attached
    // still lets the UI show the selected plan during the trial.
    const isPaidPlan = Boolean(plan) && (plan!.price ?? 0) > 0;

    return this.subscriptions.create({
      userId: new Types.ObjectId(userId),
      plan: plan?._id ?? null,
      status: SubscriptionStatus.Trialing,
      startDate: now,
      endDate,
      currentPeriodEnd: endDate,
      trial: true,
      currency: plan?.currency ?? 'EGP',
      autoRenew: isPaidPlan,
      cancelAtPeriodEnd: false,
      nextBillingDate: isPaidPlan ? endDate : undefined,
      failedAttempts: 0,
    } as any);
  }

  async cancel(subscriptionId: string, options: { atPeriodEnd?: boolean } = {}): Promise<ISubscription | null> {
    const subscription = await this.subscriptions.findById(subscriptionId);
    if (!subscription) {
      return null;
    }

    if (subscription.provider === PaymentProvider.Paypal && subscription.providerSubscriptionId && !options.atPeriodEnd) {
      const provider = this.providers.get(PaymentProvider.Paypal);
      await provider.cancelProviderSubscription?.(subscription.providerSubscriptionId);
    }

    if (options.atPeriodEnd) {
      return this.subscriptions.updateById(subscriptionId, {
        cancelAtPeriodEnd: true,
        autoRenew: false,
      } as any);
    }

    assertSubscriptionTransition(subscription.status, SubscriptionStatus.Canceled);
    return this.subscriptions.findOneAndUpdate(
      { _id: subscriptionId, status: subscription.status },
      { $set: { status: SubscriptionStatus.Canceled, autoRenew: false, cancelAtPeriodEnd: false } },
      { new: true }
    );
  }

  // Reflect a provider-side cancellation/refund locally. Idempotent, and never calls
  // back out to the provider (the provider has already canceled/refunded).
  async markCanceledFromProvider(subscriptionId: string): Promise<ISubscription | null> {
    const subscription = await this.subscriptions.findById(subscriptionId);
    if (!subscription) {
      return null;
    }
    if (subscription.status === SubscriptionStatus.Canceled || subscription.status === SubscriptionStatus.Expired) {
      return subscription;
    }
    assertSubscriptionTransition(subscription.status, SubscriptionStatus.Canceled);
    return this.subscriptions.findOneAndUpdate(
      { _id: subscriptionId, status: subscription.status },
      { $set: { status: SubscriptionStatus.Canceled, autoRenew: false, cancelAtPeriodEnd: false } },
      { new: true }
    );
  }

  async markPastDue(subscriptionId: string, reason?: string): Promise<ISubscription | null> {
    const subscription = await this.subscriptions.findById(subscriptionId);
    if (!subscription) {
      return null;
    }
    assertSubscriptionTransition(subscription.status, SubscriptionStatus.PastDue);

    const gracePeriodEnd = new Date();
    gracePeriodEnd.setUTCDate(gracePeriodEnd.getUTCDate() + 3);

    return this.subscriptions.findOneAndUpdate(
      { _id: subscriptionId, status: subscription.status },
      {
        $set: {
          status: SubscriptionStatus.PastDue,
          gracePeriodEnd,
          description: reason ?? subscription.description,
        },
        $inc: { failedAttempts: 1 },
      },
      { new: true }
    );
  }

  async expire(subscriptionId: string): Promise<ISubscription | null> {
    const subscription = await this.subscriptions.findById(subscriptionId);
    if (!subscription) {
      return null;
    }
    assertSubscriptionTransition(subscription.status, SubscriptionStatus.Expired);
    return this.subscriptions.findOneAndUpdate(
      { _id: subscriptionId, status: subscription.status },
      { $set: { status: SubscriptionStatus.Expired, autoRenew: false } },
      { new: true }
    );
  }

  async toggleAutoRenew(subscriptionId: string, autoRenew: boolean): Promise<ISubscription | null> {
    return this.subscriptions.updateById(subscriptionId, {
      autoRenew,
      cancelAtPeriodEnd: autoRenew ? false : undefined,
    } as any);
  }

  async getSubscription(userId: string): Promise<ISubscription | null> {
    const subscription = await this.subscriptions.findOne({
      userId,
      status: {
        $in: [
          SubscriptionStatus.Active,
          SubscriptionStatus.Trialing,
          SubscriptionStatus.PendingPayment,
          SubscriptionStatus.PastDue,
        ],
      },
    });

    // Return full plan details (name, price, durationMonths, deviceLimit, featureFlags)
    // instead of a bare ObjectId so the client doesn't need a second round-trip.
    return subscription ? subscription.populate('plan') : null;
  }

  private async findSubscriptionForPayment(userId: string, payment: IPayment): Promise<ISubscription | null> {
    if (payment.subscriptionId) {
      const byId = await this.subscriptions.findById(String(payment.subscriptionId));
      if (byId) {
        return byId;
      }
    }

    return this.subscriptions.findOne({
      userId,
      status: {
        $in: [
          SubscriptionStatus.PendingPayment,
          SubscriptionStatus.Active,
          SubscriptionStatus.Trialing,
          SubscriptionStatus.PastDue,
        ],
      },
    });
  }
}

export { SubscriptionService };
export default new SubscriptionService();
