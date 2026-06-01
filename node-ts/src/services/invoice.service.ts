import { Types } from 'mongoose';
import InvoiceModel from '../models/invoice';
import { IInvoice } from '../models/interfaces/invoice.interface';
import { IMenuItem } from '../models/interfaces/menu-item.interface';
import { ISessionCategory } from '../models/interfaces/session-category.interface';
import { IInvoiceService } from './interfaces/IInvoiceService';
import { InvoiceRepository } from '../repositories/InvoiceRepository';
import ShiftService from './shift.service';

class InvoiceService implements IInvoiceService {
  private readonly invoiceRepository = new InvoiceRepository(InvoiceModel);

  calculateCategoriesTotal(categories: ISessionCategory[]): number {
    return categories.reduce((total, category) => {
      if (!category.startTime || !category.endTime) {
        return total;
      }

      const startTime = category.startTime instanceof Date ? category.startTime : new Date(category.startTime);
      const endTime = category.endTime instanceof Date ? category.endTime : new Date(category.endTime);
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);

      return total + durationHours * Number(category.price ?? 0);
    }, 0);
  }

  calculateMenuItemsTotal(menuItems: IMenuItem[]): number {
    return menuItems.reduce((acc, item) => acc + Number(item.quantity ?? 0) * Number(item.price ?? 0), 0);
  }

  calculateInvoiceTotals(invoice: Pick<IInvoice, 'categories' | 'menuItems'>) {
    const categoriesTotal = this.calculateCategoriesTotal(invoice.categories as ISessionCategory[]);
    const menuItemsTotal = this.calculateMenuItemsTotal(invoice.menuItems as IMenuItem[]);

    return {
      categoriesTotal,
      menuItemsTotal,
      total: categoriesTotal + menuItemsTotal,
    };
  }

  async syncInvoiceTotals(
    invoice: Pick<IInvoice, 'categories' | 'menuItems' | 'categoriesTotal' | 'menuItemsTotal' | 'total'> & {
      save: () => Promise<unknown>;
    }
  ): Promise<void> {
    const { categoriesTotal, menuItemsTotal, total } = this.calculateInvoiceTotals(invoice);
    invoice.categoriesTotal = categoriesTotal;
    invoice.menuItemsTotal = menuItemsTotal;
    invoice.total = total;
    await invoice.save();
  }

  async createNewInvoice(payload: Partial<IInvoice>, authUserId: string): Promise<any> {
    const invoicesCount = await this.invoiceRepository.countDocuments({ brancheId: payload.brancheId as any });
    const createdBy = new Types.ObjectId(authUserId);
    const currentShift = payload.brancheId
      ? await ShiftService.getCurrentShift(authUserId, String(payload.brancheId))
      : null;
    const categories = Array.isArray(payload.categories) ? payload.categories : [];

    if (categories[0]) {
      (categories[0] as any).createdBy = createdBy;
    }

    const invoice = await this.invoiceRepository.create({
      ...payload,
      createdBy,
      shiftId: currentShift?._id ?? null,
      invoiceNo: 20250601 + invoicesCount + 1,
      categories,
    } as any);

    await this.syncInvoiceTotals(invoice);
    return invoice;
  }

  async getInvoicesByEmployeeWithCounts(empId: string): Promise<any> {
    return this.invoiceRepository.getInvoicesByEmployeeWithCounts(empId);
  }
}

export default new InvoiceService();
