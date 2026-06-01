import { IPlan } from '../../types';
import { planRepository } from '../../repositories/instances';

class PlanManager {
  async create(name: string, description: string, price: number, durationMonths: number): Promise<IPlan> {
    return planRepository.create({ name, description, price, durationMonths } as any);
  }

  async update(planId: string, name: string, description: string, price: number, durationMonths: number): Promise<IPlan | null> {
    return await planRepository.updateById(planId, { name, description, price, durationMonths } as any);
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

