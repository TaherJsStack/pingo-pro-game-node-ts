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
      this.sendResponse(res, 201, [savedItem]);
    } catch (err: any) {
      this.sendErrorResponse(res, err);
    }
  };

  public getAllItems = async (req: Request, res: Response): Promise<void> => {
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

      const items = await this.model.find(filter).sort({ createdAt: -1, activeState: 1 });
      // this.sendResponse(res, 200, items);
      res.status(200).json({
        success: true,
        errors: [],
        status: 200,
        message: 'Categories updated successfully',
        data: items 
      });
    } catch (err: any) {
      this.sendErrorResponse(res, err);
    }
  };

  public getItemById = async (req: Request, res: Response): Promise<void> => {
    try {
      const item = await this.model.findById(req.params.id);
      if (!item) {
        res.status(404).json({ msg: 'Item not found' });
      }
      this.sendResponse(res, 200, item);
    } catch (err: any) {
      this.sendErrorResponse(res, err);
    }
  };

  public updateItem = async (req: Request, res: Response): Promise<void> => {
    console.log('updateItem -->', req.params.id)
    try {
      const updatedItem = await this.model.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updatedItem) {
       res.status(404).json({ msg: 'Item not found' });
      }
      this.sendResponse(res, 200, [updatedItem]);
    } catch (err: any) {
      this.sendErrorResponse(res, err);
    }
  };

  public deleteItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const deletedItem = await this.model.findByIdAndDelete(req.params.id);
      if (!deletedItem) {
       res.status(404).json({ msg: 'Item not found' });
      }
      this.sendResponse(res, 200, [deletedItem]);
    } catch (err: any) {
      this.sendErrorResponse(res, err);
    }
  };

  // protected sendResponse(res: Response, statusCode: number, data: any) {
  //   res.status(statusCode).json({
  //     success: true,
  //     errors: [],
  //     status: statusCode,
  //     message: '',
  //     data: data,
  //   });
  // }

  // protected sendErrorResponse(res: Response, err: any) {
  //   console.error('Error:', err.message);
  //   res.status(500).json({
  //     success: false,
  //     errors: [err.message],
  //     status: 500,
  //     message: '',
  //     data: {},
  //   });
  // }

  protected parseFilter(filter: any) {
    try {
      return typeof filter === 'string' ? JSON.parse(filter) : {};
    } catch {
      return {};
    }
  }
}
