import mongoose, { Model, Schema } from 'mongoose';
import { IInvoice } from './interfaces/invoice.interface';
import { menuItemSchema } from './schemas/menu-item.schema';
import { sessionCategorySchema } from './schemas/session-category.schema';

type InvoiceModel = Model<IInvoice>;

const invoiceSchema: Schema<IInvoice, InvoiceModel> = new Schema<IInvoice, InvoiceModel>(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
    closedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', default: null },
    brancheId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branche', required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: false, default: null },
    shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: false, default: null },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: false, default: null },
    // clientId: {  },
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    activeState: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    description: { type: String, default: '' },
    total: { type: Number, default: 0 },
    categoriesTotal: { type: Number, default: 0 },
    menuItemsTotal: { type: Number, default: 0 },
    invoiceNo: { type: Number, default: 0 },
    categories: [sessionCategorySchema],
    menuItems: [menuItemSchema],
  },
  {
    timestamps: true,
  }
);

const Invoice: InvoiceModel = mongoose.model<IInvoice, InvoiceModel>('Invoice', invoiceSchema);

export default Invoice;
