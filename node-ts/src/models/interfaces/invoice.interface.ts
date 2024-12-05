import mongoose, {  Document } from 'mongoose';
import { IInvoiceMenuItem } from './invoice-menu-item.interface';
import { ICategories } from './categories.interface';

export interface IMenuItems extends Document {
    itemID: mongoose.Types.ObjectId;
    itemName: string;
    quantity: number;
    price: number;
}


export interface IInvoice extends Document {
    createdBy: mongoose.Types.ObjectId;
    closedBy?: mongoose.Types.ObjectId;
    brancheId: mongoose.Types.ObjectId;
    clientId: mongoose.Types.ObjectId;
    name: string;
    phone: string;
    activeState: boolean;
    createdAt: Date;
    description: string;
    total: number;
    categoriesTotal: number;
    menuItemsTotal: number;
    categories: ICategories[];
    menuItems: IMenuItems[];
    calculateCategoriesTotal(): Promise<number>;
    calculateMenuItemsTotal(): Promise<number>;
  }