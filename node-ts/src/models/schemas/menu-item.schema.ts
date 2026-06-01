import mongoose, { Schema } from 'mongoose';
import { IInvoiceMenuItem } from '../interfaces/invoice-menu-item.interface';
import { IMenuItem } from '../interfaces/menu-item.interface';

export const menuItemSchema: Schema<IMenuItem> = new Schema<IMenuItem>(
  {
    itemID: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', default: null },
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, default: 1 },
  },
  { _id: false }
);

export const invoiceMenuItemSchema: Schema<IInvoiceMenuItem> = new Schema<IInvoiceMenuItem>(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', required: true },
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, default: 1 },
  },
  { _id: false }
);
