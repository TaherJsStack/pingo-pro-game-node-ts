import Subscription from '../../models/subscription';
import {ISubscription} from '../../models/interfaces/subscription.interface';

class SubscriptionManager {
  async createSubscription(userId: string, plan: string, trialDays: number = 0): Promise<ISubscription> {
    const startDate = new Date();
    const endDate = new Date();
    if (trialDays > 0) {
      endDate.setDate(endDate.getDate() + trialDays); // Set trial period in days
    } else {
      endDate.setMonth(endDate.getMonth() + 12); // Regular subscription period of 12 months
    }

    const subscription = new Subscription({
      userId,
      plan,
      status: 'active',
      startDate,
      endDate,
      trial: trialDays > 0,
    });

    return await subscription.save();
  }

  async updateSubscription(subscriptionId: string, plan: string): Promise<ISubscription | null> {
    return await Subscription.findByIdAndUpdate(subscriptionId, { plan }, { new: true });
  }

  async cancelSubscription(subscriptionId: string): Promise<ISubscription | null> {
    return await Subscription.findByIdAndUpdate(subscriptionId, { status: 'canceled' }, { new: true });
  }

  async getSubscription(userId: string): Promise<ISubscription | null> {
    return await Subscription.findOne({ userId, status: 'active' });
  }

  async renewSubscription(subscriptionId: string): Promise<ISubscription | null> {
    const subscription = await Subscription.findById(subscriptionId);
    if (subscription && subscription.status === 'active') {
      subscription.endDate.setMonth(subscription.endDate.getMonth() + 12);
      return await subscription.save();
    }
    return null;
  }

  async isTrialPeriodActive(subscriptionId: string): Promise<boolean> {
    const subscription = await Subscription.findById(subscriptionId);
    if (subscription && subscription.trial) {
      const now = new Date();
      return now <= subscription.endDate;
    }
    return false;
  }
}

export default SubscriptionManager;
