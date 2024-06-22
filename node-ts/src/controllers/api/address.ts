import { Request, Response } from 'express';
// import { CRUDController } from './base/CRUDController';
import { IAddress } from '../../models/interfaces/address.interface';
import AddressModel from '../../models/address';
import { CreateOperation } from '../interfaces/CreateOperation';

// import { SendResponse } from './base/sendResponse';
import { IAuth } from '../../models/interfaces/auth.interface';
import { CRUDController } from '../base/CRUDController';
const { ObjectId } = require('mongoose').Types;

// interface CreateItemRequest extends Request {
//   body: IAddress;
//   authData: {
//     id: string;
//   };
// }

export class AddressController extends CRUDController<IAddress> implements CreateOperation<IAddress>{
  constructor() {
    super(AddressModel);
  }

  createItemAuthAddress = async ( res: Response, auth: IAuth): Promise<void| {}> => {
    try {
      const newItem: IAddress = new AddressModel();
      // newItem['ownerId'] = req['_id']
      // if ('ownerId' in this.model.schema.obj) {
        newItem.$set('ownerId', new ObjectId(auth._id));
      // }
      const savedItem = await newItem.save();
      return savedItem
      // this.sendResponse(res, 201, [savedItem]);
    } catch (err: any) {
      // this.sendErrorResponse(res, err);
    }
  };



}
