import { IInvoice } from '../../models/interfaces/invoice.interface';

export interface IInvoiceService {
  calculateDevicesTotal(devices: any[]): number;
  calculateMenuItemsTotal(menuItems: any[]): number;
  syncInvoiceTotals(invoice: any): Promise<void>;
  createNewInvoice(payload: Partial<IInvoice>, authUserId: string): Promise<any>;
  getInvoicesByEmployeeWithCounts(empId: string): Promise<any>;
}
