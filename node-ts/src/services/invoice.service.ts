import { Types } from 'mongoose';
import CounterModel from '../models/counter';
import InvoiceModel from '../models/invoice';
import { IInvoice } from '../models/interfaces/invoice.interface';
import { IMenuItem } from '../models/interfaces/menu-item.interface';
import { ISession } from '../models/interfaces/session.interface';
import { ISessionDevice } from '../models/interfaces/session-device.interface';
import { IInvoiceService } from './interfaces/IInvoiceService';
import { InvoiceRepository } from '../repositories/InvoiceRepository';
import { clientRepository } from '../repositories/instances';
import AnalyticsService from './analytics.service';
import ShiftService from './shift.service';
import { deviceCharge, roundMoney, sumMoney } from '../util/money';
import RealtimeService from './realtime.service';
import { RealtimeEvent } from '../enums';
import NotificationService from './notification.service';
import SettingsModel from '../models/settings';

class InvoiceService implements IInvoiceService {
  private readonly invoiceRepository = new InvoiceRepository(InvoiceModel);

  private toInvoiceDate(value: unknown): Date | undefined {
    if (!value) return undefined;
    const parsedDate = value instanceof Date ? value : new Date(value as string);
    return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
  }

  private calculateDeviceRevenue(device: ISessionDevice): number {
    return deviceCharge(device);
  }

  private async emitInvoiceAnalytics(invoice: IInvoice): Promise<void> {
    if (!invoice.tenantId || !invoice.brancheId) {
      return;
    }

    const tenantId = String(invoice.tenantId);
    const brancheId = String(invoice.brancheId);
    const shiftId = invoice.shiftId ? String(invoice.shiftId) : null;

    await Promise.all([
      ...invoice.devices.map((device) =>
        AnalyticsService.recordEvent({
          tenantId,
          brancheId,
          shiftId,
          invoiceId: String(invoice._id),
          sessionId: invoice.sessionId ? String(invoice.sessionId) : null,
          deviceType: String(device.type ?? 'room'),
          eventType: 'invoice_device_revenue',
          amount: this.calculateDeviceRevenue(device as ISessionDevice),
          occurredAt: device.endTime ? new Date(device.endTime) : new Date(),
          metadata: {
            deviceId: String(device.deviceId),
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

  /**
   * Compensating rollback when an invoice fails to persist after its number was allocated.
   * Without DB transactions (this deployment is not a replica set) a failed create would
   * otherwise burn the number and leave a gap. The guard `sequence: allocatedNo` makes the
   * decrement a no-op if any concurrent allocation already advanced the counter, so we never
   * hand the same number to two requests. Best-effort: it never throws.
   */
  async releaseInvoiceNo(tenantId: string, brancheId: string | Types.ObjectId, allocatedNo: number): Promise<void> {
    if (!tenantId || !allocatedNo) {
      return;
    }

    try {
      await CounterModel.updateOne(
        {
          tenantId: new Types.ObjectId(tenantId),
          brancheId: new Types.ObjectId(String(brancheId)),
          scope: 'invoice',
          sequence: allocatedNo,
        },
        { $inc: { sequence: -1 } }
      ).exec();
    } catch (error) {
      console.warn('Failed to release invoice number', error);
    }
  }

  calculateDevicesTotal(devices: ISessionDevice[]): number {
    return sumMoney(devices.map((device) => deviceCharge(device)));
  }

  calculateMenuItemsTotal(menuItems: IMenuItem[]): number {
    return sumMoney(menuItems.map((item) => Number(item.quantity ?? 0) * Number(item.price ?? 0)));
  }

  calculateInvoiceTotals(invoice: Pick<IInvoice, 'devices' | 'menuItems'>) {
    const devicesTotal = this.calculateDevicesTotal(invoice.devices as ISessionDevice[]);
    const menuItemsTotal = this.calculateMenuItemsTotal(invoice.menuItems as IMenuItem[]);

    return {
      devicesTotal,
      menuItemsTotal,
      total: sumMoney([devicesTotal, menuItemsTotal]),
    };
  }

  buildInvoiceDevicesFromSession(session: Pick<ISession, 'devices'>, closedBy: Types.ObjectId) {
    return (session.devices ?? []).map((device: any) => ({
      deviceId: device.deviceId,
      createdBy: device.createdBy ?? closedBy,
      closedBy: device.closedBy ?? closedBy,
      type: device.type ?? 'room',
      Sessiontype: device.Sessiontype ?? 'open',
      mode: device.mode ?? 'single',
      price: Number(device.price ?? 0),
      startTime: this.toInvoiceDate(device.startTime) ?? new Date(),
      endTime: this.toInvoiceDate(device.endTime),
      estimationTime: device.estimationTime ?? '',
      estimationInHours: Number(device.estimationInHours ?? 0),
      estimationInMinutes: Number(device.estimationInMinutes ?? 0),
    }));
  }

  buildInvoiceMenuItemsFromSession(session: Pick<ISession, 'menuItems'>, closedBy: Types.ObjectId) {
    return Array.isArray(session.menuItems)
      ? session.menuItems.map((item: any) => ({
          itemID: item.itemID,
          createdBy: item.createdBy ?? closedBy,
          itemName: item.itemName,
          quantity: Number(item.quantity ?? 0),
          price: Number(item.price ?? 0),
        }))
      : [];
  }

  async syncInvoiceTotals(
    invoice: Pick<IInvoice, 'devices' | 'menuItems' | 'devicesTotal' | 'menuItemsTotal' | 'total'> & {
      save: () => Promise<unknown>;
    }
  ): Promise<void> {
    const { devicesTotal, menuItemsTotal, total } = this.calculateInvoiceTotals(invoice);
    invoice.devicesTotal = devicesTotal;
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
        devicesTotal,
        menuItemsTotal,
      });
    }
  }

  async createInvoiceFromSession(session: any, body: any, authUserId: string, tenantId?: string): Promise<any> {
    const scope = { tenantId, requireTenant: true };
    const existingInvoice = await this.invoiceRepository.findOne({ sessionId: session._id }, scope);
    if (existingInvoice) {
      return existingInvoice;
    }

    if (!tenantId) {
      throw new Error('Tenant scope is required to create invoices.');
    }
    if (!session.brancheId) {
      throw new Error('Branche is required to create invoices.');
    }

    const closedBy = new Types.ObjectId(authUserId);
    const client = session.clientId ? await clientRepository.findById(String(session.clientId), scope) : null;
    const invoiceNo = await this.allocateInvoiceNo(tenantId, session.brancheId);

    try {
      const createdInvoice = await this.invoiceRepository.create({
        sessionId: session._id,
        tenantId: tenantId ? new Types.ObjectId(tenantId) : session.tenantId ?? null,
        shiftId: session.shiftId ?? null,
        createdBy: closedBy,
        closedBy,
        brancheId: session.brancheId,
        clientId: session.clientId ?? null,
        name: body.name ?? client?.name ?? '',
        phone: body.phone ?? client?.phone ?? '',
        activeState: false,
        description: body.description ?? session.description ?? '',
        invoiceNo,
        devices: this.buildInvoiceDevicesFromSession(session, closedBy),
        menuItems: this.buildInvoiceMenuItemsFromSession(session, closedBy),
      } as any, scope);

      await this.syncInvoiceTotals(createdInvoice);
      return createdInvoice;
    } catch (error) {
      await this.releaseInvoiceNo(tenantId, session.brancheId, invoiceNo);
      throw error;
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
    const devices = Array.isArray(payload.devices) ? payload.devices : [];

    if (devices[0]) {
      (devices[0] as any).createdBy = createdBy;
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
        devices,
        clientRequestId,
      } as any;

      let result;
      try {
        result = await this.invoiceRepository.upsertByClientRequestId(invoicePayload, scope);
      } catch (error) {
        await this.releaseInvoiceNo(tenantId, payload.brancheId as Types.ObjectId, invoiceNo);
        throw error;
      }
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
      devices,
      clientRequestId,
    } as any;

    let invoice;
    try {
      invoice = await this.invoiceRepository.create(invoicePayload, scope);
    } catch (error) {
      await this.releaseInvoiceNo(tenantId, payload.brancheId as Types.ObjectId, invoiceNo);
      throw error;
    }

    await this.syncInvoiceTotals(invoice);
    await this.emitInvoiceAnalytics(invoice);
    return invoice;
  }

  async getInvoicesByEmployeeWithCounts(empId: string, tenantId?: string): Promise<any> {
    return this.invoiceRepository.getInvoicesByEmployeeWithCounts(empId, { tenantId, requireTenant: true });
  }
}

export default new InvoiceService();
