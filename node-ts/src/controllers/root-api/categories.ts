import { Request, Response } from 'express';
import { Types } from 'mongoose';
import CategoryModel from '../../models/category';
import { ICategory } from '../../models/interfaces/category.interface';
import { CRUDController } from '../base/CRUDController';
import { BaseRepository } from '../../repositories/BaseRepository';
// import { CRUDController } from './base/CRUDController';
// const { ObjectId } = require('mongoose').Types;

// interface CreateItemRequest extends Request {
//   authData: {
//     id: string;
//   };
//   body: ICategory;
// }

export class CategoryController extends CRUDController<ICategory> {
  constructor() {
    super(new BaseRepository<ICategory>(CategoryModel));
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
