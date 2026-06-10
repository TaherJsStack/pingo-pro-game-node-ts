import { Types } from 'mongoose';
import DeviceModel from '../models/device';
import SessionModel from '../models/session';
import { BaseRepository } from '../repositories/BaseRepository';
import { SessionRepository } from '../repositories/SessionRepository';
import { ISession } from '../models/interfaces/session.interface';
import InvoiceService from './invoice.service';
import { ISessionService } from './interfaces/ISessionService';
import { NotFoundError, ValidationError } from '../errors/AppError';
import ShiftService from './shift.service';
import AnalyticsService from './analytics.service';
import { deviceCharge } from '../util/money';
import { resolveEndTime } from '../util/session-time';
import { resolveDeviceRate } from '../util/device-pricing';
import RealtimeService from './realtime.service';
import { RealtimeEvent } from '../enums';

export class SessionService implements ISessionService {
  private readonly deviceRepository = new BaseRepository<any>(DeviceModel);
  private readonly sessionRepository = new SessionRepository(SessionModel);

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

  async createItem(
    body: ISession,
    authUserId: string,
    tenantId?: string
  ): Promise<{ item: any; wasAddedToExisting: boolean }> {
    
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
        const devicePrice = await resolveDeviceRate(device.deviceId, scope, mode);
        return {
          ...device,
          deviceId: this.toObjectId(device.deviceId, 'deviceId'),
          createdBy,
          closedBy: device.closedBy ?? null,
          type: deviceType,
          Sessiontype: device.Sessiontype ?? 'open',
          mode,
          startTime: device.startTime ?? new Date(),
          price: devicePrice,
          estimationInHours: Number(device.estimationInHours ?? 0),
          estimationInMinutes: Number(device.estimationInMinutes ?? 0),
        };
      })
    );
    // Always check for an existing active session for this client+branch first
    const existingSession = clientId
      ? await this.sessionRepository.findActiveSessionByClientAndBranch(clientId, branchId)
      : null;
    if (existingSession) {
      existingSession.devices.push(...devices);
      const saved = await existingSession.save();
      return { item: saved, wasAddedToExisting: true };
    }

    // No existing session — create new one with idempotency if key provided
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

      return { item: result.item, wasAddedToExisting: !result.created };
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
    return { item: createdSession, wasAddedToExisting: false };
  }

  async endSession(sessionId: string, body: any, authUserId: string, tenantId?: string): Promise<{ session: any; bill: any; message: string }> {
    const scope = { tenantId, requireTenant: true };
    const session = await this.sessionRepository.findById(sessionId, scope);
    if (!session) throw new NotFoundError('Session not found');

    const closedBy = this.toObjectId(authUserId, 'Authenticated user id');
    const requestedDeviceIds = this.normalizeDeviceIds(body);
    if (!requestedDeviceIds.length) throw new ValidationError('At least one deviceId is required to end a session.');

    const matchedDeviceIds = new Set<string>();
    for (const device of session.devices as any[]) {
      const deviceId = String(device.deviceId);
      if (!requestedDeviceIds.includes(deviceId)) continue;
      matchedDeviceIds.add(deviceId);
      if (!device.endTime) {
        device.endTime = resolveEndTime(body.endTime, device.startTime);
        device.closedBy = closedBy;
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
            occurredAt: this.toInvoiceDate(device.endTime) ?? new Date(),
            metadata: {
              deviceId: String(device.deviceId),
            },
          })
        )
      );
    }

    let createdBill = null;
    if (allDevicesEnded) {
      createdBill = await InvoiceService.createInvoiceFromSession(savedSession, body, authUserId, tenantId);
    }

    return {
      session: savedSession,
      bill: createdBill,
      message: createdBill ? 'Session ended and bill created successfully.' : 'Session devices ended successfully.',
    };
  }
}
