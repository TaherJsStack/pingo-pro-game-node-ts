import { IPlan } from '../../types';
import { planRepository } from '../../repositories/instances';
import { CRUDController } from '../base/CRUDController';
import { toMinor } from '../../util/money';

class PlanManager extends CRUDController<IPlan> {
  constructor() {
    super(planRepository);
  }

  async create(name: string, description: string, price: number, durationMonths: number, currency = 'EGP'): Promise<IPlan> {
    return planRepository.create({
      name,
      description,
      price,
      durationMonths,
      currency,
      amountMinor: toMinor(price, currency),
      billingIntervalMonths: durationMonths,
    } as any);
  }

  async update(planId: string, name: string, description: string, price: number, durationMonths: number, currency = 'EGP'): Promise<IPlan | null> {
    return await planRepository.updateById(planId, {
      name,
      description,
      price,
      durationMonths,
      currency,
      amountMinor: toMinor(price, currency),
      billingIntervalMonths: durationMonths,
    } as any);
  }

  async delete(planId: string): Promise<IPlan | null> {
    return await planRepository.deleteById(planId);
  }

  async getPlan(planId: string): Promise<IPlan | null> {
    return await planRepository.findById(planId);
  }

  async getAllPlans(): Promise<IPlan[]> {
    return await planRepository.find();
  }
}

export default PlanManager;

