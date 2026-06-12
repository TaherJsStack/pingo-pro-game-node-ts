import { Request, Response } from 'express';
import { IPlan } from '../../types';
import { planRepository } from '../../repositories/instances';
import { CRUDController } from '../base/CRUDController';

class PlanManager extends CRUDController<IPlan> {
  constructor() {
    super(planRepository);
  }

  protected override getRequestScope(): undefined {
    return undefined;
  }

  // Public catalog: active plans only, cheapest first — for the pricing UI.
  public listPublicPlans = async (req: Request, res: Response): Promise<void> => {
    try {
      const items = await planRepository.find({ activeState: true }, { sort: { price: 1 } });
      this.sendResponse(req, res, 200, items, items.length);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };
}

export default PlanManager;
