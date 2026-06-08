import { Request, Response } from 'express';
// import { CRUDController } from './base/CRUDController';
import { IBranche } from '../../types';
import { CRUDController } from '../base/CRUDController';
import { brancheRepository } from '../../repositories/instances';
import { buildUploadUrl } from '../../util/uploads';
const { ObjectId } = require('mongoose').Types;


export class BrancheController extends CRUDController<IBranche> {
  constructor() {
    super(brancheRepository);
  }

  override createItem = async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.file) {
        (req.body as any)['logo'] = buildUploadUrl(req, req.file.filename);
      }
      const payload: any = { ...(req.body as any) };
      if ((req as any).authData?.id) {
        payload.ownerId = new ObjectId((req as any).authData.id);
      }
      const savedItem = await this.repository.create(payload, this.getRequestScope(req));
      // const totalData = await this.model.find().countDocuments();
      this.sendResponse(req, res, 201, [savedItem], 1, 'new branche added successfully, with id: ' + req.body.ownerId);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };

  override getAllItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const filter = this.parseFilter(req.query.Filter);
      const ownerId = (req as any).authData?.id ?? filter['ownerId'];

      // console.log('branches filter -->', filter);
      if (!ownerId) {
        return this.sendResponse(req, res, 200, [], 0, 'no branche found!!');
      }
      const query = { ownerId };
      const scope = this.getScope(req);
      const items = await this.repository.find(query, { sort: { createdAt: -1, activeState: 1 }, scope });
      const totalData = await this.repository.countDocuments(query, scope);


      this.sendResponse(req, res, 200, items, totalData, 'branche');
      // req: Request, res: Response, statusCode: number, data: any, totalData?: number, message?: string
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);  
    }
  }

  
}

