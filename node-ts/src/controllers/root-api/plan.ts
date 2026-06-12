import { Request, Response } from 'express';
import PlanModel from '../../models/plan';
import { PLAN_SEEDS } from '../../DB/seeders/plan.seeder';
import PlanManager from '../api/plan-manager';

export class AdminPlanController extends PlanManager {
  async createDefaults(req: Request, res: Response): Promise<void> {
    try {
      const results = await Promise.all(
        PLAN_SEEDS.map((seed) =>
          PlanModel.findOneAndUpdate({ code: seed.code }, seed, {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          })
        )
      );

      this.sendResponse(req, res, 200, results, results.length, 'Default plans seeded');
    } catch (error: any) {
      this.sendErrorResponse(req, res, error);
    }
  }
}
