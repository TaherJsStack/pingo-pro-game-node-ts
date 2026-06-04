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

      // End planless/non-recurring trials and past-due grace periods that have lapsed.
      await this.expireEndedSubscriptions(now);
    } finally {
      this.dueRunInFlight = false;
    }
  }

  async expireEndedSubscriptions(now: Date = new Date()): Promise<void> {
    // Planless / non-auto-renew trials whose trial window has closed.
    const endedTrials = await this.subscriptions.find({
      status: SubscriptionStatus.Trialing,
      autoRenew: { $ne: true },
      endDate: { $lte: now },
    });
    for (const subscription of endedTrials) {
      await this.subscriptionService.expire(String(subscription._id));
    }

    // Past-due subscriptions that have exhausted their grace period.
    const lapsedPastDue = await this.subscriptions.find({
      status: SubscriptionStatus.PastDue,
      gracePeriodEnd: { $lte: now },
    });
    for (const subscription of lapsedPastDue) {
      await this.subscriptionService.expire(String(subscription._id));
    }
  }

  async reconcilePendingPayments(now: Date = new Date()): Promise<void> {
    if (this.reconcileRunInFlight) {
      return;
    }
    this.reconcileRunInFlight = true;
    try {
      // Only inspect payments that have been pending a while; query the provider for the real
      // status before failing, so a legitimate in-flight checkout (PayPal approval, wallet
      // confirmation) is never failed just for being slow. Unknown status is only failed after
      // a hard timeout as a safety net against perpetually-pending rows.
      const queryAfter = new Date(now.getTime() - 30 * 60 * 1000);
      const hardTimeout = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const stalePayments = await this.payments.find({
        status: PaymentStatus.Pending,
        createdAt: { $lte: queryAfter },
      });

      for (const payment of stalePayments) {
        await this.reconcileOnePendingPayment(payment, hardTimeout);
      }
    } finally {
      this.reconcileRunInFlight = false;
    }
  }

  private async reconcileOnePendingPayment(payment: IPayment, hardTimeout: Date): Promise<void> {
    let providerStatus: PaymentStatus | null = null;
    try {
      const provider = this.providers.get(payment.provider as PaymentProvider);
      providerStatus = provider.getPaymentStatus ? await provider.getPaymentStatus(payment) : null;
    } catch (error: any) {
      providerStatus = null;
    }

    if (providerStatus === PaymentStatus.Paid) {
      await this.payments.updateById(String(payment._id), { status: PaymentStatus.Paid } as any);
      const plan = payment.planId ? await this.plans.findById(String(payment.planId)) : null;
      if (plan) {
        await this.subscriptionService.activateOrRenew(String(payment.userId), plan, {
          ...payment,
          status: PaymentStatus.Paid,
        });
      }
      return;
    }

    if (providerStatus === PaymentStatus.Failed || providerStatus === PaymentStatus.Canceled) {
      await this.failPendingPayment(payment, 'Provider reported the payment as not completed.');
      return;
    }

    // Unknown / still pending at the provider: only fail after the hard timeout.
    const createdAt = payment.createdAt ?? new Date(0);
    if (createdAt <= hardTimeout) {
      await this.failPendingPayment(payment, 'Pending payment was not confirmed before the hard timeout.');
    }
  }

  private async failPendingPayment(payment: IPayment, reason: string): Promise<void> {
    await this.payments.updateById(String(payment._id), {
      status: PaymentStatus.Failed,
      failureReason: reason,
    } as any);
    if (payment.subscriptionId) {
      await this.subscriptionService.markPastDue(String(payment.subscriptionId), reason);
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
