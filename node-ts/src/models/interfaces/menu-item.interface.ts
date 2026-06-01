import { ObjectId } from './common.interface';

export interface IMenuItem {
  itemID: ObjectId;
  createdBy?: ObjectId | null;
  itemName: string;
  quantity: number;
  price: number;
}
