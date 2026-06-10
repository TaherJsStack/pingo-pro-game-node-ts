import { Types } from 'mongoose';
import DeviceModel from '../models/device';
import ClientModel from '../models/client';
import SessionModel from '../models/session';
import InvoiceModel from '../models/invoice';
import { BaseRepository } from '../repositories/BaseRepository';
import { SessionRepository } from '../repositories/SessionRepository';
import { InvoiceRepository } from '../repositories/InvoiceRepository';
import { ISession } from '../models/interfaces/session.interface';
import InvoiceService from './invoice.service';
import { ISessionService } from './interfaces/ISessionService';
import { NotFoundError, ValidationError } from '../errors/AppError';
import ShiftService from './shift.service';
import AnalyticsService from './analytics.service';
import { deviceCharge } from '../util/money';
import RealtimeService from './realtime.service';
import { RealtimeEvent } from '../enums';

export class SessionService implements ISessionService {
  private readonly deviceRepository = new BaseRepository<any>(DeviceModel);
  private readonly clientRepository = new BaseRepository<any>(ClientModel);
  private readonly sessionRepository = new SessionRepository(SessionModel);
  private readonly invoiceRepository = new InvoiceRepository(InvoiceModel);

  private normalizeDeviceIds(body: any): string[] {
    const idsFromDevices = Array.isArray(body.devices)
      ? body.devices.map((device: any) => String(device?.deviceId ?? '')).filter(Boolean)
      : [];
    const requestedIds = (body.devicesIds ?? (body.deviceId ? [body.deviceId] : idsFromDevices)) as Array<string | number>;
    return [...new Set(requestedIds.map((id) => String(id)).filter(Boolean))];
  }

  private toInvoiceDate(value: unknown): Date | undefined {
    if (!value) return undefined;
    const parsedDate = value instanceof Date ? value : new Date(value as string);
    return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
  }

  private resolvePriceValue(currentPrice: unknown, fallbackPrice: number): number {
    const parsedPrice = Number(currentPrice ?? 0);
    return parsedPrice > 0 ? parsedPrice : Number(fallbackPrice ?? 0);
  }

  private toObjectId(value: unknown, fieldName: string): Types.ObjectId {
    const normalizedValue =
      value instanceof Types.ObjectId
        ? value.toString()
        : typeof value === 'string'
          ? value.trim()
          : String(value ?? '');

    if (!normalizedValue) {
      throw new ValidationError(`${fieldName} is required.`);
    }

    if (!Types.ObjectId.isValid(normalizedValue)) {
      throw new ValidationError(`${fieldName} must be a valid ObjectId.`);
    }

    try {
      return new Types.ObjectId(normalizedValue);
    } catch {
      throw new ValidationError(`${fieldName} must be a valid ObjectId.`);
    }
  }

  private calculateDeviceRevenue(device: any): number {
    return deviceCharge(device);
  }

  private async emitSessionAnalytics(
    session: any,
    eventType: 'session_opened' | 'session_closed',
    authUserId: string,
    tenantId?: string
  ): Promise<void> {
    if (!tenantId || !session?.brancheId) {
      return;
    }

    const basePayload = {
      tenantId,
      brancheId: String(session.brancheId),
      shiftId: session.shiftId ? String(session.shiftId) : null,
      sessionId: String(session._id),
      occurredAt: new Date(),
    };

    await Promise.all(
      (session.devices ?? []).map((device: any) =>
        AnalyticsService.recordEvent({
          ...basePayload,
          deviceType: String(device.type ?? 'room'),
          eventType,
          amount: 0,
          metadata: {
            deviceId: String(device.deviceId),
            createdBy: authUserId,
          },
        })
      )
    );
  }

  private async resolveDeviceRate(deviceId: any, scope: any, mode: 'single' | 'multi'): Promise<number> {
    if (!deviceId) return 0;
    const device = await this.deviceRepository.findById(this.toObjectId(deviceId, 'deviceId').toString(), scope);
    return Number(mode === 'multi' ? device?.priceMulti ?? 0 : device?.price ?? 0);
  }

  async createItem(body: ISession, authUserId: string, tenantId?: string): Promise<any> {
    const createdBy = this.toObjectId(authUserId, 'Authenticated user id');
    const branchId = this.toObjectId(body.brancheId, 'brancheId');
    const clientId = body.clientId ? this.toObjectId(body.clientId, 'clientId') : null;
    const resolvedTenantId = tenantId ? this.toObjectId(tenantId, 'tenantId') : null;
    const scope = { tenantId, requireTenant: true };
    const currentShift = body.brancheId
      ? await ShiftService.getCurrentShift(createdBy.toString(), branchId.toString(), resolvedTenantId?.toString())
      : null;
    const incomingDevices = Array.isArray(body.devices) ? body.devices : [];
    const clientRequestId = (body as any).clientRequestId ? String((body as any).clientRequestId) : undefined;
    const devices = await Promise.all(
      incomingDevices.map(async (device: any) => {
        const deviceType = String(device.type ?? 'room');
        const mode = device.mode === 'multi' ? 'multi' : 'single';
        const devicePrice = await this.resolveDeviceRate(device.deviceId, scope, mode);
        return {
          ...device,
          deviceId: this.toObjectId(device.deviceId, 'deviceId'),
          createdBy,
          closedBy: device.closedBy ?? null,
          type: deviceType,
          Sessiontype: device.Sessiontype ?? 'open',
          mode,
          startTime: device.startTime ?? new Date(),
          price: this.resolvePriceValue(device.price, devicePrice),
          estimationInHours: Number(device.estimationInHours ?? 0),
          estimationInMinutes: Number(device.estimationInMinutes ?? 0),
        };
      })
    );

    if (clientRequestId) {
      const result = await this.sessionRepository.upsertByClientRequestId(
        {
          ...body,
          createdBy,
          tenantId: resolvedTenantId,
          brancheId: branchId,
          clientId,
          activeState: true,
          devices,
          shiftId: currentShift?._id ?? null,
          clientRequestId,
        } as any,
        scope
      );

      if (result.created) {
        await this.emitSessionAnalytics(result.item, 'session_opened', authUserId, tenantId);
        if (tenantId) {
          RealtimeService.emitToTenant(tenantId, RealtimeEvent.SessionOpened, {
            tenantId,
            brancheId: String(body.brancheId ?? ''),
            sessionId: String(result.item._id),
            shiftId: result.item.shiftId ? String(result.item.shiftId) : null,
          });
          RealtimeService.emitToTenant(tenantId, RealtimeEvent.TableStatusChanged, {
            tenantId,
            brancheId: String(body.brancheId ?? ''),
            sessionId: String(result.item._id),
            shiftId: result.item.shiftId ? String(result.item.shiftId) : null,
            activeState: true,
          });
        }
      }

      return result.item;
    }

    const existingSession = body.clientId
      ? await this.sessionRepository.findActiveSessionByClientAndBranch(clientId, branchId, scope)
      : null;
    if (existingSession) {
      existingSession.devices.push(...devices);
      return existingSession.save();
    }

    const createdSession = await this.sessionRepository.create({
      ...body,
      createdBy,
      tenantId: resolvedTenantId,
      brancheId: branchId,
      clientId,
      activeState: true,
      devices,
      shiftId: currentShift?._id ?? null,
    } as any, scope);

    await this.emitSessionAnalytics(createdSession, 'session_opened', authUserId, tenantId);
    if (tenantId) {
      RealtimeService.emitToTenant(tenantId, RealtimeEvent.SessionOpened, {
        tenantId,
        brancheId: String(body.brancheId ?? ''),
        sessionId: String(createdSession._id),
        shiftId: createdSession.shiftId ? String(createdSession.shiftId) : null,
      });
      RealtimeService.emitToTenant(tenantId, RealtimeEvent.TableStatusChanged, {
        tenantId,
        brancheId: String(body.brancheId ?? ''),
        sessionId: String(createdSession._id),
        shiftId: createdSession.shiftId ? String(createdSession.shiftId) : null,
        activeState: true,
      });
    }
    return createdSession;
  }

  async endSession(sessionId: string, body: any, authUserId: string, tenantId?: string): Promise<{ session: any; bill: any; message: string }> {
    const scope = { tenantId, requireTenant: true };
    const session = await this.sessionRepository.findById(sessionId, scope);
    if (!session) throw new NotFoundError('Session not found');

    const closedBy = this.toObjectId(authUserId, 'Authenticated user id');
    const requestedDeviceIds = this.normalizeDeviceIds(body);
    if (!requestedDeviceIds.length) throw new ValidationError('At least one deviceId is required to end a session.');

    const parsedEndTime = body.endTime ? new Date(body.endTime) : new Date();
    if (Number.isNaN(parsedEndTime.getTime())) throw new ValidationError('Invalid endTime value.');

    const matchedDeviceIds = new Set<string>();
    for (const device of session.devices as any[]) {
      const deviceId = String(device.deviceId);
      if (!requestedDeviceIds.includes(deviceId)) continue;
      matchedDeviceIds.add(deviceId);
      if (!device.endTime) {
        const mode = device.mode === 'multi' ? 'multi' : 'single';
        const devicePrice = await this.resolveDeviceRate(device.deviceId, scope, mode);
        device.endTime = parsedEndTime;
        device.closedBy = closedBy;
        device.price = this.resolvePriceValue(device.price, devicePrice);
      }
    }
    if (!matchedDeviceIds.size) {
      throw new ValidationError('No matching session devices were found for the provided devicesIds list.');
    }

    if (body.description?.trim()) session.description = body.description.trim();
    await Promise.all([
      ...matchedDeviceIds,
    ].map((deviceId) =>
      this.deviceRepository.updateOne(
        { _id: this.toObjectId(deviceId, 'deviceId') },
        { $set: { bookState: false } },
        { scope }
      )
    ));

    const allDevicesEnded = (session.devices as any[]).every((device) => !!device.endTime);
    if (allDevicesEnded) session.activeState = false;
    const savedSession = await session.save();

    await this.emitSessionAnalytics(savedSession, 'session_closed', authUserId, tenantId);
    if (tenantId || (session as any).tenantId) {
      const resolvedTenantId = tenantId ?? String((session as any).tenantId);
      RealtimeService.emitToTenant(resolvedTenantId, RealtimeEvent.SessionClosed, {
        tenantId: resolvedTenantId,
        brancheId: String(session.brancheId),
        sessionId: String(session._id),
        shiftId: (session as any).shiftId ? String((session as any).shiftId) : null,
        activeState: false,
      });
      RealtimeService.emitToTenant(resolvedTenantId, RealtimeEvent.TableStatusChanged, {
        tenantId: resolvedTenantId,
        brancheId: String(session.brancheId),
        sessionId: String(session._id),
        shiftId: (session as any).shiftId ? String((session as any).shiftId) : null,
        activeState: false,
      });
    }

    if (tenantId || (session as any).tenantId) {
      await Promise.all(
        (session.devices as any[]).map((device) =>
          AnalyticsService.recordEvent({
            tenantId: tenantId ?? String((session as any).tenantId),
            brancheId: String(session.brancheId),
            shiftId: (session as any).shiftId ? String((session as any).shiftId) : null,
            sessionId: String(session._id),
            invoiceId: null,
            deviceType: String(device.type ?? 'room'),
            eventType: 'device_utilization',
            amount: this.calculateDeviceRevenue(device),
            occurredAt: this.toInvoiceDate(device.endTime) ?? parsedEndTime,
            metadata: {
              deviceId: String(device.deviceId),
            },
          })
        )
      );
    }

    let createdBill = null;
    if (allDevicesEnded) {
      const existingInvoice = await this.invoiceRepository.findOne({ sessionId: session._id }, scope);
      if (existingInvoice) {
        createdBill = existingInvoice;
      } else {
        if (!tenantId) {
          throw new Error('Tenant scope is required to create invoices.');
        }
        if (!session.brancheId) {
          throw new Error('Branche is required to create invoices.');
        }
        const client = session.clientId ? await this.clientRepository.findById(session.clientId, scope) : null;
        const invoiceNo = await InvoiceService.allocateInvoiceNo(tenantId, session.brancheId);
        try {
        createdBill = await this.invoiceRepository.create({
          sessionId: session._id,
          tenantId: tenantId ? this.toObjectId(tenantId, 'tenantId') : (session as any).tenantId ?? null,
          shiftId: (session as any).shiftId ?? null,
          createdBy: closedBy,
          closedBy,
          brancheId: session.brancheId,
          clientId: session.clientId ?? null,
          name: body.name ?? client?.name ?? '',
          phone: body.phone ?? client?.phone ?? '',
          activeState: false,
          description: body.description ?? session.description ?? '',
          invoiceNo,
          devices: session.devices.map((device: any) => ({
            deviceId: device.deviceId,
            createdBy: device.createdBy ?? new Types.ObjectId(authUserId),
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
          })),
          menuItems: Array.isArray(session.menuItems)
            ? session.menuItems.map((item: any) => ({
                itemID: item.itemID,
                createdBy: item.createdBy ?? closedBy,
                itemName: item.itemName,
                quantity: Number(item.quantity ?? 0),
                price: Number(item.price ?? 0),
              }))
            : [],
        } as any, scope);
        } catch (error) {
          await InvoiceService.releaseInvoiceNo(tenantId, session.brancheId, invoiceNo);
          throw error;
        }
        await InvoiceService.syncInvoiceTotals(createdBill);
      }
    }

    return {
      session: savedSession,
      bill: createdBill,
      message: createdBill ? 'Session ended and bill created successfully.' : 'Session devices ended successfully.',
    };
  }
}
