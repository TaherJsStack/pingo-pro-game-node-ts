import {ISubscription} from '../../types';
import { subscriptionRepository } from '../../repositories/instances';

class SubscriptionManager {
  async createSubscription(userId: string, plan: string | null, trialDays: number = 0): Promise<ISubscription> {
    const startDate = new Date();
    const endDate = new Date();
    if (trialDays > 0) {
      endDate.setDate(endDate.getDate() + trialDays); // Set trial period in days
    } else {
      endDate.setMonth(endDate.getMonth() + 12); // Regular subscription period of 12 months
    }

    return subscriptionRepository.create({
      userId,
      plan: plan || null,
      status: 'active',
      startDate,
      endDate,
      trial: trialDays > 0,
    } as any);
  }

  async updateSubscription(subscriptionId: string, plan: string | null): Promise<ISubscription | null> {
    return await subscriptionRepository.updateById(subscriptionId, { plan } as any);
  }

  async cancelSubscription(subscriptionId: string): Promise<ISubscription | null> {
    return await subscriptionRepository.updateById(subscriptionId, { status: 'canceled' } as any);
  }

  async getSubscription(userId: string): Promise<ISubscription | null> {
    return await subscriptionRepository.findOne({ userId, status: 'active' });
  }

  async renewSubscription(subscriptionId: string): Promise<ISubscription | null> {
    const subscription = await subscriptionRepository.findById(subscriptionId);
    if (subscription && subscription.status === 'active') {
      subscription.endDate.setMonth(subscription.endDate.getMonth() + 12);
      return await subscriptionRepository.updateById(subscriptionId, {
        endDate: subscription.endDate,
      } as any);
    }
    return null;
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

