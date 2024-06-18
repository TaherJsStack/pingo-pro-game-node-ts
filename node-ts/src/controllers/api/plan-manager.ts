import Plan from '../../models/plan';
import { IPlan } from '../../models/interfaces/plan.interface';

class PlanManager {
  async create(name: string, description: string, price: number, durationMonths: number): Promise<IPlan> {
    const plan = new Plan({ name, description, price, durationMonths });
    return await plan.save();
  }

  async update(planId: string, name: string, description: string, price: number, durationMonths: number): Promise<IPlan | null> {
    return await Plan.findByIdAndUpdate(planId, { name, description, price, durationMonths }, { new: true });
  }

  async delete(planId: string): Promise<IPlan | null> {
    return await Plan.findByIdAndDelete(planId);
  }

  async getPlan(planId: string): Promise<IPlan | null> {
    return await Plan.findById(planId);
  }

  async getAllPlans(): Promise<IPlan[]> {
    return await Plan.find();
  }
}

export default PlanManager;
