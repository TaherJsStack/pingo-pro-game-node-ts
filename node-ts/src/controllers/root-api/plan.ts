import { Request, Response } from 'express';
import PlanModel from '../../models/plan';
import PlanManager from '../api/plan-manager';

export class AdminPlanController extends PlanManager {
  async createDefaults(req: Request, res: Response): Promise<void> {
    try {
      const defaults = [
        { code: 'free', name: 'الباقة المجانية', tier: 'basic', price: 0, durationMonths: 1 },
        { code: 'quarterly', name: 'الباقة الربع سنوية', tier: 'basic', price: 150, durationMonths: 3 },
        { code: 'extended', name: 'الباقة السنوية المميزة', tier: 'advanced', price: 450, durationMonths: 12 },
      ];

      const results = await Promise.all(
        defaults.map((item) =>
          PlanModel.findOneAndUpdate({ code: item.code }, item, {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          })
        )
      );

      this.sendResponse(req, res, 200, results, results.length, 'Default plans created');
    } catch (error: any) {
      this.sendErrorResponse(req, res, error);
    }
  }
}
