import { Request, Response } from 'express';
import BrancheModel from '../../models/branche';
// import { CRUDController } from './base/CRUDController';
import { IBranche } from '../../models/interfaces/branche.interface';
import { CRUDController } from '../base/CRUDController';


export class BrancheController extends CRUDController<IBranche> {
  constructor() {
    super(BrancheModel);
  }

  override getAllItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const filter = this.parseFilter(req.query.Filter);
      // console.log('Clients getAllItems filter -->', filter);
      // console.log('filter -->', this.model);
      for (const property in filter) {
        // console.log(`${property}: ${filter[property]}`);
        if (!(property in this.model.schema.obj)) {
          delete filter[property];
        }
      }
      // console.log('filter -->', filter);

      const items = await this.model.find().sort({ createdAt: -1, activeState: 1 });
      this.sendResponse(req, res, 200, items);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };
  
}
