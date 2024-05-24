import mongoose, { Document, Schema, Model } from 'mongoose';
import { IInvoiceMenuItem } from './interfaces/invoice-menu-item.interface';
import { IInvoiceMenu } from './interfaces/invoice-menu.interface';

const invoiceMenuSchema: Schema<IInvoiceMenu> = new Schema<IInvoiceMenu>({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
  closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth' },
  brancheId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branche', required: true },
  client: { type: String, required: true },
  total: { type: Number, default: 0 },
  activeState: { type: Boolean, default: true },
  createdAt: { type: Date, default: new Date() },
  description: { type: String, default: '' },
  menuItems: [
    {
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', required: true },
      itemName: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, default: 1 }
    }
  ]
}, {
  timestamps: true
});

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

export default mongoose.model<IInvoiceMenu, Model<IInvoiceMenu>>('invoiceMenu', invoiceMenuSchema);