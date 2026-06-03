import { PaymentStatus, SubscriptionStatus } from '../../enums';
import { IPayment } from '../../models/interfaces/payment.interface';
import { IPlan } from '../../models/interfaces/plan.interface';
import { ISubscription } from '../../models/interfaces/subscription.interface';

export type SubscriptionTransitionMap = Record<SubscriptionStatus, SubscriptionStatus[]>;

export interface ISubscriptionService {
  activateOrRenew(userId: string, plan: IPlan, payment: IPayment): Promise<ISubscription | null>;
  startTrial(userId: string, plan: IPlan, trialDays: number): Promise<ISubscription>;
  cancel(subscriptionId: string, options?: { atPeriodEnd?: boolean }): Promise<ISubscription | null>;
  markPastDue(subscriptionId: string, reason?: string): Promise<ISubscription | null>;
  expire(subscriptionId: string): Promise<ISubscription | null>;
  toggleAutoRenew(subscriptionId: string, autoRenew: boolean): Promise<ISubscription | null>;
  getSubscription(userId: string): Promise<ISubscription | null>;
}

export interface SubscriptionStateInput {
  from: SubscriptionStatus;
  to: SubscriptionStatus;
  paymentStatus?: PaymentStatus;
}
