import { Request, Response } from 'express';
import BrancheModel from '../../models/branche';
// import { CRUDController } from './base/CRUDController';
import { IBranche } from '../../models/interfaces/branche.interface';
import { CRUDController } from '../base/CRUDController';
import { BaseRepository } from '../../repositories/BaseRepository';


export class BrancheController extends CRUDController<IBranche> {
  constructor() {
    super(new BaseRepository<IBranche>(BrancheModel));
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
