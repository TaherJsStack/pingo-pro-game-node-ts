import { Types } from 'mongoose';
import CounterModel from '../models/counter';
import InvoiceModel from '../models/invoice';
import { IInvoice } from '../models/interfaces/invoice.interface';
import { IMenuItem } from '../models/interfaces/menu-item.interface';
import { ISessionCategory } from '../models/interfaces/session-category.interface';
import { IInvoiceService } from './interfaces/IInvoiceService';
import { InvoiceRepository } from '../repositories/InvoiceRepository';
import AnalyticsService from './analytics.service';
import ShiftService from './shift.service';
import { roundMoney } from '../util/money';
import RealtimeService from './realtime.service';
import { RealtimeEvent } from '../enums';
import NotificationService from './notification.service';
import SettingsModel from '../models/settings';

class InvoiceService implements IInvoiceService {
  private readonly invoiceRepository = new InvoiceRepository(InvoiceModel);

  private calculateCategoryRevenue(category: ISessionCategory): number {
    if (!category.startTime || !category.endTime) {
      return 0;
    }

    const startTime = category.startTime instanceof Date ? category.startTime : new Date(category.startTime);
    const endTime = category.endTime instanceof Date ? category.endTime : new Date(category.endTime);
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    return roundMoney(durationHours * Number(category.price ?? 0));
  }

  private async emitInvoiceAnalytics(invoice: IInvoice): Promise<void> {
    if (!invoice.tenantId || !invoice.brancheId) {
      return;
    }

    const tenantId = String(invoice.tenantId);
    const brancheId = String(invoice.brancheId);
    const shiftId = invoice.shiftId ? String(invoice.shiftId) : null;

    await Promise.all([
      ...invoice.categories.map((category) =>
        AnalyticsService.recordEvent({
          tenantId,
          brancheId,
          shiftId,
          invoiceId: String(invoice._id),
          sessionId: invoice.sessionId ? String(invoice.sessionId) : null,
          deviceType: String(category.type ?? 'room'),
          eventType: 'invoice_category_revenue',
          amount: this.calculateCategoryRevenue(category as ISessionCategory),
          occurredAt: category.endTime ? new Date(category.endTime) : new Date(),
          metadata: {
            pricingMode: category.pricingMode ?? 'hourly',
            pricingId: category.pricingId ? String(category.pricingId) : null,
          },
        })
      ),
      invoice.menuItemsTotal > 0
        ? AnalyticsService.recordEvent({
            tenantId,
            brancheId,
            shiftId,
            invoiceId: String(invoice._id),
            sessionId: invoice.sessionId ? String(invoice.sessionId) : null,
          deviceType: 'menu',
          eventType: 'invoice_menu_revenue',
          amount: Number(invoice.menuItemsTotal ?? 0),
          occurredAt: new Date(invoice.createdAt ?? new Date()),
        })
        : Promise.resolve(),
      AnalyticsService.recordEvent({
        tenantId,
        brancheId,
        shiftId,
        invoiceId: String(invoice._id),
        sessionId: invoice.sessionId ? String(invoice.sessionId) : null,
        deviceType: 'invoice',
        eventType: 'invoice_settled',
        amount: Number(invoice.total ?? 0),
        occurredAt: new Date(invoice.createdAt ?? new Date()),
      }),
    ]);

    void this.queueInvoiceThresholdNotification(invoice).catch((error) => {
      console.warn('Failed to queue invoice notification', error);
    });
  }

  private async queueInvoiceThresholdNotification(invoice: IInvoice): Promise<void> {
    if (!invoice.tenantId || !invoice.brancheId) {
      return;
    }

    const settings = await SettingsModel.findOne({ tenantId: invoice.tenantId, activeState: true }).lean();
    const threshold = Number(settings?.notifications?.tableCloseThreshold ?? 0);
    if (!threshold || Number(invoice.total ?? 0) < threshold) {
      return;
    }

    await NotificationService.queueTableClosed({
      tenantId: String(invoice.tenantId),
      tableName: invoice.sessionId ? String(invoice.sessionId) : String(invoice.brancheId),
      total: Number(invoice.total ?? 0),
    });
  }

  async allocateInvoiceNo(tenantId: string, brancheId: string | Types.ObjectId): Promise<number> {
    if (!tenantId) {
      throw new Error('Tenant scope is required to allocate invoice numbers.');
    }

    const counter = await CounterModel.findOneAndUpdate(
      {
        tenantId: new Types.ObjectId(tenantId),
        brancheId: new Types.ObjectId(String(brancheId)),
        scope: 'invoice',
      },
      {
        $inc: { sequence: 1 },
        $setOnInsert: {
          tenantId: new Types.ObjectId(tenantId),
          brancheId: new Types.ObjectId(String(brancheId)),
          scope: 'invoice',
        },
      },
      {
        new: true,
        upsert: true,
      }
    ).exec();

    if (!counter) {
      throw new Error('Failed to allocate invoice number.');
    }

    return counter.sequence;
  }

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

    const realtimeInvoice = invoice as Partial<IInvoice> & { _id?: unknown };
    if (realtimeInvoice.tenantId) {
      RealtimeService.emitToTenant(String(realtimeInvoice.tenantId), RealtimeEvent.InvoiceUpdated, {
        tenantId: String(realtimeInvoice.tenantId),
        brancheId: realtimeInvoice.brancheId ? String(realtimeInvoice.brancheId) : null,
        invoiceId: String(realtimeInvoice._id ?? ''),
        sessionId: realtimeInvoice.sessionId ? String(realtimeInvoice.sessionId) : null,
        shiftId: realtimeInvoice.shiftId ? String(realtimeInvoice.shiftId) : null,
        total,
        categoriesTotal,
        menuItemsTotal,
      });
    }
  }

  async createNewInvoice(payload: Partial<IInvoice>, authUserId: string, tenantId?: string): Promise<any> {
    if (!tenantId) {
      throw new Error('Tenant scope is required to create invoices.');
    }
    if (!payload.brancheId) {
      throw new Error('Branche is required to create invoices.');
    }

    const scope = { tenantId, requireTenant: true };
    const createdBy = new Types.ObjectId(authUserId);
    const clientRequestId = (payload as any).clientRequestId ? String((payload as any).clientRequestId) : undefined;
    const currentShift = payload.brancheId
      ? await ShiftService.getCurrentShift(authUserId, String(payload.brancheId), tenantId)
      : null;
    const categories = Array.isArray(payload.categories) ? payload.categories : [];

    if (categories[0]) {
      (categories[0] as any).createdBy = createdBy;
    }

    if (clientRequestId) {
      const existingInvoice = await this.invoiceRepository.findOne({ clientRequestId }, scope);
      if (existingInvoice) {
        return existingInvoice;
      }

      const invoiceNo = await this.allocateInvoiceNo(tenantId, payload.brancheId as Types.ObjectId);
      const invoicePayload = {
        ...payload,
        createdBy,
        tenantId: tenantId ? new Types.ObjectId(tenantId) : null,
        shiftId: currentShift?._id ?? null,
        invoiceNo,
        categories,
        clientRequestId,
      } as any;

      const result = await this.invoiceRepository.upsertByClientRequestId(invoicePayload, scope);
      if (result.created) {
        await this.syncInvoiceTotals(result.item);
        await this.emitInvoiceAnalytics(result.item);
      }
      return result.item;
    }

    const invoiceNo = await this.allocateInvoiceNo(tenantId, payload.brancheId as Types.ObjectId);
    const invoicePayload = {
      ...payload,
      createdBy,
      tenantId: tenantId ? new Types.ObjectId(tenantId) : null,
      shiftId: currentShift?._id ?? null,
      invoiceNo,
      categories,
      clientRequestId,
    } as any;

    const invoice = await this.invoiceRepository.create(invoicePayload, scope);

    await this.syncInvoiceTotals(invoice);
    await this.emitInvoiceAnalytics(invoice);
    return invoice;
  }

  async getInvoicesByEmployeeWithCounts(empId: string, tenantId?: string): Promise<any> {
    return this.invoiceRepository.getInvoicesByEmployeeWithCounts(empId, { tenantId, requireTenant: true });
  }
}

export default new InvoiceService();
