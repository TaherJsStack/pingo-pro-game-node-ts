import { IDevices } from './devices.interface';
import { IMenuItem } from './menu-item.interface';
import { ActivityFields, BaseEntity, ModelDocument, ObjectId } from './common.interface';

export type IMenuItems = IMenuItem;

export interface IInvoice extends BaseEntity, ActivityFields {
  createdBy: ObjectId;
  tenantId?: ObjectId | null;
  clientRequestId?: string;
  closedBy: ObjectId | null;
  brancheId: ObjectId;
  sessionId: ObjectId | null;
  shiftId?: ObjectId | null;
  clientId: ObjectId | null;
  name: string;
  phone: string;
  total: number;
  devicesTotal: number;
  menuItemsTotal: number;
  devices: IDevices[];
  menuItems: IMenuItem[];
  invoiceNo: number;
}

export type InvoiceDocument = ModelDocument<IInvoice>;
