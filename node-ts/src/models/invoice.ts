import mongoose, { Document, Schema, Model } from 'mongoose';
import { ICategories } from './interfaces/categories.interface';
import { IInvoice, IMenuItems } from './interfaces/invoice.interface';

const invoiceSchema: Schema<IInvoice> = new Schema<IInvoice>(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
    closedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', default: null },
    brancheId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branche', required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: false, default: null },
    // clientId: {  },
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    activeState: { type: Boolean, default: true },
    createdAt: { type: Date, default: new Date() },
    description: { type: String, default: '' },
    total: { type: Number, default: 0 },
    categoriesTotal: { type: Number, default: 0 },
    menuItemsTotal: { type: Number, default: 0 },
    categories: [
      {
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: false, default: null },
        closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', default: null },
        type: { type: String, default: 'open', required: true }, // open or match
        price: { type: Number, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String },
        estimationTime: { type: String },
        estimationInHours: { type: Number, default: 0 },
        estimationInMinutes: { type: Number, default: 0 },
      },
    ],
    menuItems: [
      {
        itemID: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', required: true },
        itemName: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, default: 1 },
      },
    ],
  },
  {
    timestamps: true,
  }
);

invoiceSchema.methods.calculateCategoriesTotal = async function (): Promise<number> {
  try {
    let total = 0;

    this.categories.forEach((category: ICategories) => {
      if (category.startTime && category.endTime) {
        // Parse the startTime and endTime strings into Date objects
        const startTime = new Date(category.startTime);
        const endTime = new Date(category.endTime);
        // Calculate duration in hours
        const durationMs = endTime.getTime() - startTime.getTime();
        const durationHours = durationMs / (1000 * 60 * 60); // Convert milliseconds to hours
        // Calculate quantity based on duration and price per hour
        const categoryTotal = durationHours * category.price;
        // Add categoryTotal to overall total
        total += categoryTotal;
      }
    });

    // Update the total field in the document
    this.categoriesTotal = total;
    await this.save();
    return this.categoriesTotal;
  } catch (error) {
    throw error;
  }
};

invoiceSchema.methods.calculateMenuItemsTotal = async function (): Promise<number> {
  try {
    const total = this.menuItems.reduce((acc: number, item: IMenuItems) => acc + item.quantity * item.price, 0);
    this.menuItemsTotal = total;
    await this.save();
    return this.menuItemsTotal;
  } catch (error) {
    console.log('calculateMenuItemsTotal ----> ', error);
    throw error;
  }
};

invoiceSchema.pre('save', async function (next) {
  try {
    if (this.isNew) {
      this.total = this.menuItemsTotal + this.categoriesTotal;
    } else {
      this.total = this.menuItemsTotal + this.categoriesTotal;
    }
    next();
  } catch (error: any) {
    console.error('Error in pre-save middleware:', error);
    next(error);
  }
});

const Invoice: Model<IInvoice> = mongoose.model<IInvoice>('Invoice', invoiceSchema);

export default Invoice;