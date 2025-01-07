import { Request, Response } from 'express';
import BrancheModel from '../../models/branche';
// import { CRUDController } from './base/CRUDController';
import { IBranche } from '../../models/interfaces/branche.interface';
import { CRUDController } from '../base/CRUDController';


export class BrancheController extends CRUDController<IBranche> {
  constructor() {
    super(BrancheModel);
  }

  override createItem = async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.file) {
        (req.body as any)['logo'] = `${req.protocol}://${req.get('host')}/api/uploads/${req.file.filename}`;
      }
      const newItem: IBranche = new this.model(req.body);
      
      const savedItem = await newItem.save();
      // const totalData = await this.model.find().countDocuments();
      this.sendResponse(req, res, 201, [savedItem], 1, 'new branche added successfully, with id: ' + req.body.ownerId);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };

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
        if (property !== 'ownerId') {
          delete filter[property];
        }
      }

      // console.log('branches filter -->', filter);
      if (!filter['ownerId']) {
        return this.sendResponse(req, res, 200, [], 0, 'no branche found!!');
      }
      const items = await this.model.find(filter).sort({ createdAt: -1, activeState: 1 });
      const totalData = await this.model.find(filter).countDocuments();


      this.sendResponse(req, res, 200, items, totalData, 'branche');
      // req: Request, res: Response, statusCode: number, data: any, totalData?: number, message?: string
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);  
    }
  }

  
}
