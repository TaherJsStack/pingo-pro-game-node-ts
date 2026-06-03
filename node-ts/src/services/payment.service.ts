import { Request } from 'express';
import { Types } from 'mongoose';
import { paymentProviderFactory, PaymentProviderFactory } from '../adapters/payments/PaymentProviderFactory';
import { PaymentMethod, PaymentProvider, PaymentStatus, SubscriptionStatus } from '../enums';
import { NotFoundError, ValidationError } from '../errors/AppError';
import { IRepository } from '../repositories';
import {
  paymentInstrumentRepository,
  paymentRepository,
  planRepository,
  subscriptionRepository,
  webhookEventRepository,
} from '../repositories/instances';
import { IPayment } from '../models/interfaces/payment.interface';
import { IPaymentInstrument } from '../models/interfaces/payment-instrument.interface';
import { IPlan } from '../models/interfaces/plan.interface';
import { ISubscription } from '../models/interfaces/subscription.interface';
import { IWebhookEvent } from '../models/interfaces/webhook-event.interface';
import { toMinor } from '../util/money';
import SubscriptionService, { supportsRecurring } from './subscription.service';
import { ISubscriptionService } from './interfaces/ISubscriptionService';
import { CheckoutSession, NormalizedPaymentEvent } from './interfaces/IPaymentProvider';
import { InitiatePaymentCommand, IPaymentService, RecordWebhookResult } from './interfaces/IPaymentService';
import { paymentsConfig } from '../config/payments';

class PaymentService implements IPaymentService {
  constructor(
    private readonly payments: IRepository<IPayment> = paymentRepository,
    private readonly plans: IRepository<IPlan> = planRepository,
    private readonly subscriptions: IRepository<ISubscription> = subscriptionRepository,
    private readonly instruments: IRepository<IPaymentInstrument> = paymentInstrumentRepository,
    private readonly webhookEvents: IRepository<IWebhookEvent> = webhookEventRepository,
    private readonly providers: PaymentProviderFactory = paymentProviderFactory,
    private readonly subscriptionService: ISubscriptionService = SubscriptionService
  ) {}

  async initiate(command: InitiatePaymentCommand): Promise<CheckoutSession & { paymentId: string }> {
    this.assertPaymentsEnabled();

    const plan = await this.plans.findById(command.planId);
    if (!plan) {
      throw new NotFoundError('Plan not found.');
    }

    this.assertProviderMethod(command.provider, command.method);

    const existingPending = await this.payments.findOne({
      userId: command.userId,
      planId: command.planId,
      status: PaymentStatus.Pending,
    });
    if (existingPending?.providerOrderId && existingPending.rawCallback) {
      return {
        ...(existingPending.rawCallback as CheckoutSession),
        paymentId: String(existingPending._id),
      };
    }

    const subscription = await this.ensurePendingSubscription(command.userId, plan);
    const amountMinor = Number.isInteger(plan.amountMinor) ? plan.amountMinor : toMinor(plan.price, plan.currency);
    const payment = existingPending ?? await this.payments.create({
      userId: new Types.ObjectId(command.userId),
      subscriptionId: subscription._id,
      planId: plan._id,
      provider: command.provider,
      method: command.method,
      amountMinor,
      currency: plan.currency,
      status: PaymentStatus.Pending,
      description: command.idempotencyKey ?? '',
    } as any);

    const checkout = await this.providers.get(command.provider).initiateCheckout({
      userId: command.userId,
      planId: command.planId,
      paymentId: String(payment._id),
      amountMinor,
      currency: plan.currency,
      provider: command.provider,
      method: command.method,
      plan,
    });

    await this.payments.updateById(String(payment._id), {
      providerOrderId: checkout.providerOrderId,
      rawCallback: checkout,
    } as any);

    return {
      ...checkout,
      paymentId: String(payment._id),
    };
  }

  async recordWebhook(provider: PaymentProvider, req: Request): Promise<RecordWebhookResult> {
    this.assertPaymentsEnabled();

    const verified = await this.providers.get(provider).verifyWebhook(req);
    if (!verified.valid) {
      throw new ValidationError('Invalid payment webhook signature.');
    }

    try {
      const stored = await this.webhookEvents.create({
        provider,
        providerEventId: verified.event.providerEventId,
        eventType: verified.event.type,
        payload: {
          raw: verified.event.raw,
          normalized: verified.event,
        },
        status: 'received',
        receivedAt: new Date(),
      } as any);

      return { stored: true, webhookEventId: String(stored._id) };
    } catch (error: any) {
      if (error?.code === 11000) {
        return { stored: false };
      }
      throw error;
    }
  }

  async processWebhookEvent(eventId: string): Promise<void> {
    const webhookEvent = await this.webhookEvents.findById(eventId);
    if (!webhookEvent || webhookEvent.status === 'processed') {
      return;
    }

    const event = (webhookEvent.payload as any)?.normalized as NormalizedPaymentEvent | undefined;
    if (!event) {
      await this.webhookEvents.updateById(eventId, { status: 'failed', error: 'Missing normalized event' } as any);
      return;
    }

    try {
      await this.applyNormalizedEvent(event);
      await this.webhookEvents.updateById(eventId, {
        status: 'processed',
        processedAt: new Date(),
        error: undefined,
      } as any);
    } catch (error: any) {
      await this.webhookEvents.updateById(eventId, {
        status: 'failed',
        error: error?.message ?? 'Webhook processing failed',
      } as any);
      throw error;
    }
  }

  async listUserPayments(userId: string): Promise<IPayment[]> {
    return this.payments.find({ userId }, { sort: { createdAt: -1 } });
  }

  async getPayment(paymentId: string, userId?: string): Promise<IPayment | null> {
    const payment = await this.payments.findById(paymentId);
    if (!payment) {
      return null;
    }
    if (userId && String(payment.userId) !== String(userId)) {
      return null;
    }
    return payment;
  }

  async applyNormalizedEvent(event: NormalizedPaymentEvent): Promise<IPayment | null> {
    const payment = await this.findPaymentForEvent(event);
    if (!payment) {
      return null;
    }

    const update: Partial<IPayment> = {
      status: event.status,
      providerEventId: event.providerEventId,
      providerTransactionId: event.providerTransactionId,
      rawCallback: event.raw,
      failureReason: event.status === PaymentStatus.Failed ? event.type : undefined,
    };
    const updatedPayment = await this.payments.updateById(String(payment._id), update as any);

    if (event.status === PaymentStatus.Paid) {
      const plan = await this.plans.findById(String(payment.planId));
      if (!plan) {
        throw new NotFoundError('Payment plan not found.');
      }
      const subscription = await this.subscriptionService.activateOrRenew(String(payment.userId), plan, {
        ...payment,
        ...updatedPayment,
      });
      if (subscription) {
        await this.payments.updateById(String(payment._id), { subscriptionId: subscription._id } as any);
      }
      await this.upsertInstrumentFromEvent(event, payment, subscription);
    } else if (event.status === PaymentStatus.Failed) {
      if (payment.subscriptionId) {
        await this.subscriptionService.markPastDue(String(payment.subscriptionId), event.type);
      }
    }

    return updatedPayment;
  }

  private async ensurePendingSubscription(userId: string, plan: IPlan): Promise<ISubscription> {
    const existing = await this.subscriptionService.getSubscription(userId);
    if (existing) {
      if ([SubscriptionStatus.Active, SubscriptionStatus.Trialing].includes(existing.status)) {
        throw new ValidationError('User already has an active subscription.');
      }
      return existing;
    }

    const now = new Date();
    return this.subscriptions.create({
      userId: new Types.ObjectId(userId),
      plan: plan._id,
      status: SubscriptionStatus.PendingPayment,
      startDate: now,
      endDate: now,
      currentPeriodEnd: now,
      trial: false,
      currency: plan.currency,
      autoRenew: true,
      cancelAtPeriodEnd: false,
      failedAttempts: 0,
    } as any);
  }

  private async findPaymentForEvent(event: NormalizedPaymentEvent): Promise<IPayment | null> {
    if (event.providerEventId) {
      const byEvent = await this.payments.findOne({ providerEventId: event.providerEventId });
      if (byEvent) {
        return byEvent;
      }
    }
    if (event.providerOrderId) {
      return this.payments.findOne({ providerOrderId: event.providerOrderId });
    }
    return null;
  }

  private async upsertInstrumentFromEvent(
    event: NormalizedPaymentEvent,
    payment: IPayment,
    subscription: ISubscription | null
  ): Promise<void> {
    const token = event.cardToken;
    const providerSubscriptionId = event.subscriptionId;
    if (!token && !providerSubscriptionId) {
      return;
    }

    await this.instruments.updateOne(
      {
        userId: payment.userId,
        provider: payment.provider,
        method: payment.method,
      },
      {
        $set: {
          userId: payment.userId,
          provider: payment.provider,
          method: payment.method,
          token,
          providerSubscriptionId,
          isDefault: true,
          activeState: true,
          description: subscription ? String(subscription._id) : '',
        },
      },
      { upsert: true }
    );
  }

  private assertProviderMethod(provider: PaymentProvider, method: PaymentMethod): void {
    if (provider === PaymentProvider.Paypal && method !== PaymentMethod.Paypal) {
      throw new ValidationError('PayPal provider requires paypal payment method.');
    }
    if (provider === PaymentProvider.Paymob && method === PaymentMethod.Paypal) {
      throw new ValidationError('Paymob provider cannot use paypal payment method.');
    }
    if (!supportsRecurring(provider, method) && provider === PaymentProvider.Paymob) {
      return;
    }
  }

  private assertPaymentsEnabled(): void {
    if (!paymentsConfig.enabled) {
      throw new ValidationError('Payments are disabled. Set PAYMENTS_ENABLED=true and provide provider credentials.');
    }
  }
}

export { PaymentService };
export default new PaymentService();
