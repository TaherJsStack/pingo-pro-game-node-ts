import { Request, Response } from 'express';
import { Document, Model } from 'mongoose';
const { ObjectId } = require('mongoose').Types;
import { CreateItemRequest } from '../interfaces/CustomRequestType';
import { CreateOperation } from '../interfaces/CreateOperation';
import { ReadOperation } from '../interfaces/ReadOperation';
import { DeleteOperation } from '../interfaces/DeleteOperation';
import { UpdateOperation } from '../interfaces/UpdateOperation';
import { SendResponse } from './sendResponse';

export abstract class CRUDController<T extends Document> extends SendResponse
  implements CreateOperation<T>, ReadOperation<T>, UpdateOperation<T>, DeleteOperation<T> {
  
  protected model: Model<T>;

  constructor(model: Model<T>) {
    super();
    this.model = model;
  }

  public createItem = async (req: CreateItemRequest<T>, res: Response): Promise<void> => {
    try {
      const newItem: T = new this.model(req.body);
      if ('ownerId' in this.model.schema.obj) {
        newItem.$set('ownerId', new ObjectId(req.authData.id));
      }
      const savedItem = await newItem.save();
      const totalData = await this.model.find().countDocuments();
      this.sendResponse(req, res, 201, [savedItem], totalData);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };

  public getAllItems = async (req: Request, res: Response): Promise<void> => {
    try {
 
      // console.clear();
      // console.log('CRUDController getAllItems filter -->', req.query.Filter);
      const filter    = this.parseFilter(req.query.Filter);
      const startDate = this.parseFilter(req.query.Filter).startDate ? new Date(this.parseFilter(req.query.Filter as string).startDate) : null;
      const endDate   = this.parseFilter(req.query.Filter).endDate   ? new Date(this.parseFilter(req.query.Filter as string).endDate)   : null;
      
      const searchKeyword = filter['searchKeyword'] ? filter['searchKeyword'] : '';

      const page     = filter['pageNo']   || 1;
      const pageSize = filter['pageSize'] || 10;
      const skip     = (page - 1 ) * pageSize;

      for (const property in filter) {
        if (!(property in this.model.schema.obj)) {
          delete filter[property];
        }
      }

      // Add date range filter
      if (startDate || endDate) {
        filter['createdAt'] = {};
        if (startDate) {
          filter['createdAt']["$lte"] = new Date(startDate);
        }
        if (endDate) {
          filter['createdAt']["$gte"] = new Date(endDate);
        }
      }
      
      if (typeof filter['activeState'] === undefined || filter['activeState'] === null || filter['activeState'] === '') {
        delete filter['activeState'];
      }else if (filter['activeState'] !== undefined && typeof filter['activeState'] === 'string') {
        filter['activeState'] = filter['activeState'] === 'true' ? true : false;
      }

      // search keyword
      if (typeof searchKeyword !== 'undefined' && searchKeyword !== null && searchKeyword !== '') {
        filter['$text'] = { $search: searchKeyword };
      }

      // console.log('searchKeyword -->', searchKeyword);
      // console.log('CRUDController getAllItems filter -->', filter);

      const totalData = await this.model.find(filter).countDocuments();

      const items = await this.model.find(filter)
                                    .sort({ createdAt: -1, activeState: 1 })
                                    .skip(skip)
                                    .limit(pageSize);

      this.sendResponse(req, res, 200, items, totalData);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };

  public getItemById = async (req: Request, res: Response): Promise<void> => {
    try {
      const item = await this.model.findById(req.params.id);
      if (!item) {
        res.status(404).json({ msg: 'Item not found' });
      }
      this.sendResponse(req, res, 200, [item]);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };

  public updateItem = async (req: Request, res: Response): Promise<void> => {
    console.log('updateItem -->', req.params.id)
    try {
      const updatedItem = await this.model.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updatedItem) {
       res.status(404).json({ msg: 'Item not found' });
      }
      this.sendResponse(req, res, 200, [updatedItem]);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };

  public deleteItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const deletedItem = await this.model.findByIdAndDelete(req.params.id);
      if (!deletedItem) {
       res.status(404).json({ msg: 'Item not found' });
      }
      const totalData = await this.model.find().countDocuments();
      this.sendResponse(req, res, 200, [deletedItem], totalData);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };

  protected parseFilter(filter: any) {
    try {
      return typeof filter === 'string' ? JSON.parse(filter) : {};
    } catch {
      return {};
    }
  }
}
