import { ICategories } from './categories.interface';
import { ActivityFields, BaseEntity, ModelDocument, ObjectId } from './common.interface';

export interface IMenuItems {
  itemID: ObjectId;
  itemName: string;
  quantity: number;
  price: number;
}

export interface IInvoice extends BaseEntity, ActivityFields {
  createdBy: ObjectId;
  closedBy: ObjectId | null;
  brancheId: ObjectId;
  clientId: ObjectId | null;
  name: string;
  phone: string;
  total: number;
  categoriesTotal: number;
  menuItemsTotal: number;
  categories: ICategories[];
  menuItems: IMenuItems[];
  invoiceNo: number;
}

export interface IInvoiceMethods {
  calculateCategoriesTotal(): Promise<number>;
  calculateMenuItemsTotal(): Promise<number>;
}

export type InvoiceDocument = ModelDocument<IInvoice, IInvoiceMethods>;
