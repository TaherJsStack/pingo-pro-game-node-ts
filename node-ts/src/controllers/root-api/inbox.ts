import { Request, Response } from 'express';
import InboxModel from '../../models/inbox';
// import { CRUDController } from './base/CRUDController';
import { IInbox } from '../../models/interfaces/inbox.interface';
import { CRUDController } from '../base/CRUDController';
import { BaseRepository } from '../../repositories/BaseRepository';
const { ObjectId } = require('mongoose').Types;


export class InboxController extends CRUDController<IInbox> {
  constructor() {
    super(new BaseRepository<IInbox>(InboxModel));
  }

  public getAllItems = async (req: Request, res: Response): Promise<void> => {
    try {
      // const filter = this.parseFilter(req.query.Filter);
      // // console.log('Clients getAllItems filter -->', filter);
      // // console.log('filter -->', this.model);
      // for (const property in filter) {
      //   // console.log(`${property}: ${filter[property]}`);
      //   if (!(property in this.model.schema.obj)) {
      //     delete filter[property];
      //   }
      // }
      // // console.log('filter -->', filter);

      const items = await this.repository.find({}, { sort: { createdAt: -1, activeState: 1 } });
      this.sendResponse(req, res, 200, items);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };
  
}
