import { Types } from 'mongoose';
import { paymentProviderFactory, PaymentProviderFactory } from '../adapters/payments/PaymentProviderFactory';
import { InboxType, PaymentProvider, PaymentStatus, SubscriptionStatus } from '../enums';
import { UnsupportedRecurringError } from '../errors/AppError';
import { IRepository } from '../repositories';
import {
  inboxRepository,
  paymentInstrumentRepository,
  paymentRepository,
  planRepository,
  subscriptionRepository,
} from '../repositories/instances';
import { IInbox } from '../models/interfaces/inbox.interface';
import { IPayment } from '../models/interfaces/payment.interface';
import { IPaymentInstrument } from '../models/interfaces/payment-instrument.interface';
import { IPlan } from '../models/interfaces/plan.interface';
import { ISubscription } from '../models/interfaces/subscription.interface';
import SubscriptionService, { supportsRecurring } from './subscription.service';
import { IBillingService } from './interfaces/IBillingService';
import { ISubscriptionService } from './interfaces/ISubscriptionService';

class BillingService implements IBillingService {
  private dueRunInFlight = false;
  private reconcileRunInFlight = false;

  constructor(
    private readonly subscriptions: IRepository<ISubscription> = subscriptionRepository,
    private readonly plans: IRepository<IPlan> = planRepository,
    private readonly payments: IRepository<IPayment> = paymentRepository,
    private readonly instruments: IRepository<IPaymentInstrument> = paymentInstrumentRepository,
    private readonly inbox: IRepository<IInbox> = inboxRepository,
    private readonly providers: PaymentProviderFactory = paymentProviderFactory,
    private readonly subscriptionService: ISubscriptionService = SubscriptionService
  ) {}

  async processDueRenewals(now: Date = new Date()): Promise<void> {
    if (this.dueRunInFlight) {
      return;
    }
    this.dueRunInFlight = true;
    try {
      const dueSubscriptions = await this.subscriptions.find({
        autoRenew: true,
        status: { $in: [SubscriptionStatus.Active, SubscriptionStatus.PastDue, SubscriptionStatus.Trialing] },
        nextBillingDate: { $lte: now },
      });

      for (const subscription of dueSubscriptions) {
        await this.processOneDueSubscription(subscription);
      }
    } finally {
      this.dueRunInFlight = false;
    }
  }

  async reconcilePendingPayments(now: Date = new Date()): Promise<void> {
    if (this.reconcileRunInFlight) {
      return;
    }
    this.reconcileRunInFlight = true;
    try {
      const staleBefore = new Date(now.getTime() - 30 * 60 * 1000);
      const stalePayments = await this.payments.find({
        status: PaymentStatus.Pending,
        createdAt: { $lte: staleBefore },
      });

      for (const payment of stalePayments) {
        await this.payments.updateById(String(payment._id), {
          status: PaymentStatus.Failed,
          failureReason: 'Pending payment was not reconciled by webhook before timeout.',
        } as any);
        if (payment.subscriptionId) {
          await this.subscriptionService.markPastDue(String(payment.subscriptionId), 'Payment reconciliation timed out.');
        }
      }
    } finally {
      this.reconcileRunInFlight = false;
    }
  }

  private async processOneDueSubscription(subscription: ISubscription): Promise<void> {
    const plan = subscription.plan ? await this.plans.findById(String(subscription.plan)) : null;
    if (!plan) {
      await this.subscriptionService.markPastDue(String(subscription._id), 'Subscription plan not found.');
      return;
    }

    if (!supportsRecurring(subscription.provider, subscription.method)) {
      await this.subscriptionService.markPastDue(String(subscription._id), 'Payment method requires manual renewal.');
      await this.createRenewalNotice(subscription);
      return;
    }

    if (subscription.provider === PaymentProvider.Paypal) {
      return;
    }

    const instrument = await this.instruments.findOne({
      userId: subscription.userId,
      provider: subscription.provider,
      method: subscription.method,
      activeState: true,
    });

    if (!instrument) {
      await this.subscriptionService.markPastDue(String(subscription._id), 'No saved payment instrument.');
      await this.createRenewalNotice(subscription);
      return;
    }

    const payment = await this.payments.create({
      userId: subscription.userId,
      subscriptionId: subscription._id,
      planId: plan._id,
      provider: subscription.provider,
      method: subscription.method,
      amountMinor: plan.amountMinor,
      currency: plan.currency,
      status: PaymentStatus.Pending,
    } as any);

    try {
      const provider = this.providers.get(subscription.provider as PaymentProvider);
      if (!provider.chargeSavedToken) {
        throw new UnsupportedRecurringError('Provider does not support saved-token recurring charges.');
      }
      const event = await provider.chargeSavedToken(instrument, plan.amountMinor, plan.currency, {
        paymentId: String(payment._id),
        planId: String(plan._id),
      });

      await this.payments.updateById(String(payment._id), {
        status: event.status,
        providerEventId: event.providerEventId,
        providerTransactionId: event.providerTransactionId,
        rawCallback: event.raw,
      } as any);

      if (event.status === PaymentStatus.Paid) {
        await this.subscriptionService.activateOrRenew(String(subscription.userId), plan, {
          ...payment,
          status: PaymentStatus.Paid,
          providerEventId: event.providerEventId,
          providerTransactionId: event.providerTransactionId,
        });
      } else {
        await this.subscriptionService.markPastDue(String(subscription._id), event.type);
      }
    } catch (error: any) {
      await this.payments.updateById(String(payment._id), {
        status: PaymentStatus.Failed,
        failureReason: error?.message ?? 'Recurring charge failed.',
      } as any);
      await this.subscriptionService.markPastDue(String(subscription._id), error?.message);
    }
  }

  private async createRenewalNotice(subscription: ISubscription): Promise<void> {
    await this.inbox.create({
      ownerId: new Types.ObjectId(String(subscription.userId)),
      title: 'Subscription renewal required',
      type: InboxType.System,
      context: 'Your subscription payment method needs confirmation before the next billing cycle can continue.',
      isSeen: false,
      activeState: true,
      description: String(subscription._id),
    } as any);
  }
}

export { BillingService };
export default new BillingService();
