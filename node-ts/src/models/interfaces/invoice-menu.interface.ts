import mongoose, {  Document } from 'mongoose';
import { IInvoiceMenuItem } from './invoice-menu-item.interface';

export interface IInvoiceMenu extends Document {
  _id: mongoose.Schema.Types.ObjectId;
  createdBy: mongoose.Schema.Types.ObjectId;
  closedBy?: mongoose.Schema.Types.ObjectId;
  brancheId: mongoose.Schema.Types.ObjectId;
  client: string;
  total: number;
  activeState: boolean;
  createdAt: Date;
  description: string;
  menuItems: IInvoiceMenuItem[];
  updateTotal: () => Promise<number>;
}