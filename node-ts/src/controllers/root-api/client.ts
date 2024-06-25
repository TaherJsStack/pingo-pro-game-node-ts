import { Request, Response } from 'express';
import ClientModel from '../../models/client';
// import { CRUDController } from './base/CRUDController';
import { IClient } from '../../models/interfaces/client.interface';
import { CRUDController } from '../base/CRUDController';

export class ClientController extends CRUDController<IClient> {
  constructor() {
    super(ClientModel);
  }

  override getAllItems = async (req: Request, res: Response): Promise<void> => {
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
      // console.log('filter -->', filter);

      const items = await this.model.find().sort({ createdAt: -1, activeState: 1 });
      this.sendResponse(req, res, 200, items);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };
  

  

}
