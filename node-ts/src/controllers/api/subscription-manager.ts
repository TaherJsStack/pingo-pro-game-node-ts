import BrancheModel from '../../models/branche';
import PlanModel from '../../models/plan';
import { ISubscription } from '../../types';
import { planRepository, subscriptionRepository } from '../../repositories/instances';
import SubscriptionService from '../../services/subscription.service';
import { AppError, NotFoundError, ValidationError } from '../../errors/AppError';

class SubscriptionManager {
  async createSubscription(
    userId: string,
    brancheId: string,
    tenantId: string | null,
    plan: string | null,
    trialDays: number = 0
  ): Promise<ISubscription> {
    if (trialDays <= 0) {
      throw new ValidationError('Paid subscriptions must be initiated through /payment/initiate.');
    }

    // System/registration trials with no selected paid plan fall back to the
    // seeded Free plan, so the subscription always carries a real plan reference
    // (only truly planless when the catalog hasn't been seeded yet).
    if (!plan) {
      const freePlan = await planRepository.findOne({ code: 'free', activeState: true });
      return SubscriptionService.startTrial(userId, brancheId, tenantId, freePlan ?? null, trialDays);
    }

    const foundPlan = await planRepository.findById(plan);
    if (!foundPlan) {
      throw new NotFoundError('Plan not found.');
    }
    return SubscriptionService.startTrial(userId, brancheId, tenantId, foundPlan, trialDays);
  }

  async updateSubscription(subscriptionId: string, plan: string | null): Promise<ISubscription | null> {
    if (plan) {
      const foundPlan = await planRepository.findById(plan);
      if (!foundPlan) {
        throw new NotFoundError('Plan not found.');
      }
    }
    return await subscriptionRepository.updateById(subscriptionId, { plan } as any);
  }

  async cancelSubscription(subscriptionId: string): Promise<ISubscription | null> {
    return await SubscriptionService.cancel(subscriptionId);
  }

  async getSubscription(userId: string, brancheId?: string | null): Promise<ISubscription | null> {
    return await SubscriptionService.getSubscription(userId, brancheId);
  }

  async isTrialPeriodActive(subscriptionId: string): Promise<boolean> {
    const subscription = await subscriptionRepository.findById(subscriptionId);
    if (subscription && subscription.trial) {
      const now = new Date();
      return now <= subscription.endDate;
    }
    return false;
  }

  async assertOwnedBranch(brancheId: string, userId: string) {
    const branch = await BrancheModel.findOne({
      _id: brancheId,
      ownerId: userId,
      activeState: true,
    });
    if (!branch) {
      throw new AppError('Branch not found or access denied', 403, 'BRANCH_ACCESS_DENIED');
    }
    return branch;
  }

  async assertFreePlanAvailable(userId: string, planId: string): Promise<void> {
    const requestedPlan = await PlanModel.findById(planId);
    if (!requestedPlan) {
      throw new AppError('Plan not found', 404, 'PLAN_NOT_FOUND');
    }

    if (requestedPlan.code === 'free') {
      const freePlanIds = await PlanModel.distinct('_id', { code: 'free' });
      const alreadyUsed = await subscriptionRepository.findOne({
        userId,
        plan: { $in: freePlanIds },
      } as any);

      if (alreadyUsed) {
        throw new AppError('الباقة المجانية متاحة مرة واحدة فقط لكل مالك', 403, 'FREE_PLAN_EXHAUSTED');
      }
    }
  }
}

export default SubscriptionManager;
