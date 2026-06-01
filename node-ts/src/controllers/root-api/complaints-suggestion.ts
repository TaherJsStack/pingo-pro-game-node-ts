
import ComplaintsSuggestionModel from '../../models/complaints-suggestion';
// import { CRUDController } from './base/CRUDController';
import { IComplaintsSuggestion } from '../../models/interfaces/complaints-suggestion.interface';
import { CRUDController } from '../base/CRUDController';
import { Request, Response } from 'express';
import { BaseRepository } from '../../repositories/BaseRepository';

export class ComplaintsSuggestionController extends CRUDController<IComplaintsSuggestion> {
  constructor() {
    super(new BaseRepository<IComplaintsSuggestion>(ComplaintsSuggestionModel));
  }

  override getAllItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const items = await this.repository.find({}, { sort: { createdAt: -1, activeState: 1 } });
      this.sendResponse(req, res, 200, items);
     } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };


  
}
