import mongoose, { Model, Schema } from 'mongoose';
import { IInvoiceMenu, IInvoiceMenuMethods } from './interfaces/invoice-menu.interface';
import { IInvoiceMenuItem } from './interfaces/invoice-menu-item.interface';
import { invoiceMenuItemSchema } from './schemas/menu-item.schema';

type InvoiceMenuModel = Model<IInvoiceMenu, {}, IInvoiceMenuMethods>;

const invoiceMenuSchema: Schema<IInvoiceMenu, InvoiceMenuModel, IInvoiceMenuMethods> = new Schema<IInvoiceMenu, InvoiceMenuModel, IInvoiceMenuMethods>({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
  clientRequestId: { type: String, trim: true, index: true },
  closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth' },
  brancheId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branche', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  total: { type: Number, default: 0 },
  activeState: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  description: { type: String, default: '' },
  menuItems: [invoiceMenuItemSchema]
}, {
  timestamps: true
});
invoiceMenuSchema.index({ tenantId: 1, brancheId: 1, createdAt: -1 });
invoiceMenuSchema.index(
  { tenantId: 1, clientRequestId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      clientRequestId: { $exists: true, $type: 'string' },
    },
  }
);

invoiceMenuSchema.methods.updateTotal = async function (): Promise<number> {
  try {
    const total = this.menuItems.reduce((acc: number, item: IInvoiceMenuItem) => acc + item.quantity * item.price, 0);
    this.total = total;
    await this.save();
    return this.total;
  } catch (error) {
    throw error;
  }
};

export default mongoose.model<IInvoiceMenu, InvoiceMenuModel>('invoiceMenu', invoiceMenuSchema);
