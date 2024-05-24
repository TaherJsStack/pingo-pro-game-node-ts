import mongoose, {  Document } from 'mongoose';

export interface IInvoiceMenuItem {
  itemId: mongoose.Schema.Types.ObjectId;
  itemName: string;
  quantity: number;
  price: number;
}