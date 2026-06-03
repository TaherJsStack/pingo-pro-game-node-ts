import {ISubscription} from '../../types';
import { planRepository, subscriptionRepository } from '../../repositories/instances';
import { SubscriptionStatus } from '../../enums/subscription-status.enum';
import SubscriptionService from '../../services/subscription.service';
import { NotFoundError, ValidationError } from '../../errors/AppError';

class SubscriptionManager {
  async createSubscription(userId: string, plan: string | null, trialDays: number = 0): Promise<ISubscription> {
    if (trialDays > 0) {
      if (!plan) {
        throw new ValidationError('Plan is required to start a trial.');
      }
      const foundPlan = await planRepository.findById(plan);
      if (!foundPlan) {
        throw new NotFoundError('Plan not found.');
      }
      return SubscriptionService.startTrial(userId, foundPlan, trialDays);
    }

    throw new ValidationError('Paid subscriptions must be initiated through /payment/initiate.');
  }

  async updateSubscription(subscriptionId: string, plan: string | null): Promise<ISubscription | null> {
    return await subscriptionRepository.updateById(subscriptionId, { plan } as any);
  }

  async cancelSubscription(subscriptionId: string): Promise<ISubscription | null> {
    return await SubscriptionService.cancel(subscriptionId);
  }

  async getSubscription(userId: string): Promise<ISubscription | null> {
    return await SubscriptionService.getSubscription(userId);
  }

  async renewSubscription(subscriptionId: string): Promise<ISubscription | null> {
    throw new ValidationError('Subscription renewal is handled by the billing scheduler.');
  }

  async isTrialPeriodActive(subscriptionId: string): Promise<boolean> {
    const subscription = await subscriptionRepository.findById(subscriptionId);
    if (subscription && subscription.trial) {
      const now = new Date();
      return now <= subscription.endDate;
    }
    return false;
  }
}

export default SubscriptionManager;
