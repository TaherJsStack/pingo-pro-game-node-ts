import { IInvoiceMenuItem } from './invoice-menu-item.interface';
import { ActivityFields, BaseEntity, ModelDocument, ObjectId } from './common.interface';

export interface IInvoiceMenu extends BaseEntity, ActivityFields {
  createdBy: ObjectId;
  closedBy?: ObjectId | null;
  brancheId: ObjectId;
  client: string;
  total: number;
  menuItems: IInvoiceMenuItem[];
}

export interface IInvoiceMenuMethods {
  updateTotal(): Promise<number>;
}

export type InvoiceMenuDocument = ModelDocument<IInvoiceMenu, IInvoiceMenuMethods>;
