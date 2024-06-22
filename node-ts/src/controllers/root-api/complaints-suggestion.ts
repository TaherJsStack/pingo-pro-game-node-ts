
import ComplaintsSuggestionModel from '../../models/complaints-suggestion';
// import { CRUDController } from './base/CRUDController';
import { IComplaintsSuggestion } from '../../models/interfaces/complaints-suggestion.interface';
import { CRUDController } from '../base/CRUDController';
import { Request, Response } from 'express';

export class ComplaintsSuggestionController extends CRUDController<IComplaintsSuggestion> {
  constructor() {
    super(ComplaintsSuggestionModel);
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

      // const items = await this.model.find(filter).sort({ createdAt: -1, activeState: 1 });
      const items = await this.model.find().sort({ createdAt: -1, activeState: 1 });
      // this.sendResponse(res, 200, items);
      res.status(200).json({
        success: true,
        errors: [],
        status: 200,
        message: 'get all items successfully',
        data: items 
      });
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };


  
}
