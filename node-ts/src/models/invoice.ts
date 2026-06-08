import mongoose, { Model, Schema } from 'mongoose';
import { IInvoice } from './interfaces/invoice.interface';
import { menuItemSchema } from './schemas/menu-item.schema';
import { sessionDeviceSchema } from './schemas/session-device.schema';

type InvoiceModel = Model<IInvoice>;

const invoiceSchema: Schema<IInvoice, InvoiceModel> = new Schema<IInvoice, InvoiceModel>(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
    clientRequestId: { type: String, trim: true, index: true },
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
    devicesTotal: { type: Number, default: 0 },
    menuItemsTotal: { type: Number, default: 0 },
    invoiceNo: { type: Number, default: 0 },
    devices: [sessionDeviceSchema],
    menuItems: [menuItemSchema],
  },
  {
    timestamps: true,
  }
);

invoiceSchema.index({ tenantId: 1, brancheId: 1, invoiceNo: 1 }, { unique: true });
invoiceSchema.index({ tenantId: 1, brancheId: 1, createdAt: -1 });
invoiceSchema.index({ tenantId: 1, shiftId: 1, createdAt: -1 });
invoiceSchema.index({ tenantId: 1, activeState: 1, createdAt: -1 });
invoiceSchema.index(
  { tenantId: 1, clientRequestId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      clientRequestId: { $exists: true, $type: 'string' },
    },
  }
);

const Invoice: InvoiceModel = mongoose.model<IInvoice, InvoiceModel>('Invoice', invoiceSchema);

export default Invoice;
