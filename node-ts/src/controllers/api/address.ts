import { Request, Response } from 'express';
// import { CRUDController } from './base/CRUDController';
import { IAddress } from '../../types';
import { CreateOperation } from '../interfaces/CreateOperation';
import { addressRepository } from '../../repositories/instances';

// import { SendResponse } from './base/sendResponse';
import { IAuth } from '../../types';
import { CRUDController } from '../base/CRUDController';
const { ObjectId } = require('mongoose').Types;

export class AddressController extends CRUDController<IAddress> implements CreateOperation<IAddress>{
  constructor() {
    super(addressRepository);
  }

  createItemAuthAddress = async ( res: Response, auth: IAuth): Promise<void| {}> => {
    try {
      const savedItem = await this.repository.create({
        ownerId: new ObjectId(auth._id),
      } as any);
      return savedItem
      // this.sendResponse(res, 201, [savedItem]);
    } catch (err: any) {
      // this.sendErrorResponse(res, err);
    }
  };



}

