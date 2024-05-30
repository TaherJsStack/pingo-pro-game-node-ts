import { Request, Response } from 'express';
import { CRUDController } from './base/CRUDController';
import { IAddress } from '../../models/interfaces/address.interface';
import AddressModel from '../../models/address';

// interface CreateItemRequest extends Request {
//   body: IAddress;
//   authData: {
//     id: string;
//   };
// }

export class AddressController  extends CRUDController<IAddress> {
  constructor() {
    super(AddressModel);
  }


}
