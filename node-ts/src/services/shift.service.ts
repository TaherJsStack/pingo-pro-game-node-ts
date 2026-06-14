import { Types } from 'mongoose';
import ShiftModel from '../models/shift';
import InvoiceModel from '../models/invoice';
import SessionModel from '../models/session';
import { shiftRepository } from '../repositories/instances';
import { ShiftStatus } from '../enums/shift-status.enum';
import AnalyticsService from './analytics.service';
import { ConflictError, NotFoundError } from '../errors/AppError';
import RealtimeService from './realtime.service';
import { RealtimeEvent } from '../enums';
import NotificationService from './notification.service';
import { assertObjectId } from '../util/object-id';

class ShiftService {
  private async afterShiftOpened(params: {
    tenantId: string;
    brancheId: string;
    shiftId: string;
    openingCash: number;
    employeeId: string;
    openedAt: Date;
  }): Promise<void> {
    const { tenantId, brancheId, shiftId, openingCash, employeeId, openedAt } = params;

    await AnalyticsService.recordEvent({
      tenantId,
      brancheId,
      shiftId,
      deviceType: 'shift',
      eventType: 'shift_opened',
      amount: 0,
      occurredAt: openedAt,
      metadata: { openingCash, employeeId },
    });

    RealtimeService.emitToTenant(tenantId, RealtimeEvent.ShiftOpened, {
      tenantId,
      brancheId,
      shiftId,
      employeeId,
      openingCash,
      status: ShiftStatus.Open,
    });

    void NotificationService.queueShiftOpened({ tenantId, shiftId, openingCash }).catch((error) => {
      console.warn('Failed to queue shift opened notification', error);
    });
  }

  async getCurrentShift(employeeId: string, brancheId: string, tenantId?: string): Promise<any> {
    const filter: Record<string, any> = {
      employeeId: assertObjectId(employeeId, 'employeeId'),
      brancheId: assertObjectId(brancheId, 'brancheId'),
      status: ShiftStatus.Open,
      activeState: true,
    };

    if (tenantId) {
      filter.tenantId = assertObjectId(tenantId, 'tenantId');
    }

    return shiftRepository.findOne(filter as any);
  }

  async openShift(payload: { employeeId: string; tenantId?: string; brancheId: string; openingCash?: number; openedBy: string; clientRequestId?: string }): Promise<any> {
    const clientRequestId = (payload as any).clientRequestId ? String((payload as any).clientRequestId) : undefined;
    const scope = { tenantId: payload.tenantId, requireTenant: true };
    if (clientRequestId) {
      const existingShift = await shiftRepository.findOne({ clientRequestId }, scope);
      if (existingShift) {
        return existingShift;
      }
    }

    const currentShift = await this.getCurrentShift(payload.employeeId, payload.brancheId, payload.tenantId);
    if (currentShift) {
      throw new ConflictError('Employee already has an open shift in this branch.', 'SHIFT_ALREADY_OPEN');
    }

    const shiftPayload = {
      employeeId: assertObjectId(payload.employeeId, 'employeeId'),
      tenantId: payload.tenantId ? assertObjectId(payload.tenantId, 'tenantId') : null,
      brancheId: assertObjectId(payload.brancheId, 'brancheId'),
      openedBy: assertObjectId(payload.openedBy, 'openedBy'),
      openedAt: new Date(),
      openingCash: Number(payload.openingCash ?? 0),
      status: ShiftStatus.Open,
      activeState: true,
      clientRequestId,
    } as any;

    if (clientRequestId) {
      const result = await shiftRepository.upsertByClientRequestId(shiftPayload, {
        tenantId: payload.tenantId,
        requireTenant: true,
      });
      if (result.created && payload.tenantId) {
        await this.afterShiftOpened({
          tenantId: payload.tenantId,
          brancheId: payload.brancheId,
          shiftId: String(result.item._id),
          openingCash: Number(payload.openingCash ?? 0),
          employeeId: payload.employeeId,
          openedAt: new Date(result.item.openedAt ?? new Date()),
        });
      }
      return result.item;
    }

    const shift = await shiftRepository.create(shiftPayload, { tenantId: payload.tenantId, requireTenant: true });

    if (payload.tenantId) {
      await this.afterShiftOpened({
        tenantId: payload.tenantId,
        brancheId: payload.brancheId,
        shiftId: String(shift._id),
        openingCash: Number(payload.openingCash ?? 0),
        employeeId: payload.employeeId,
        openedAt: new Date(shift.openedAt ?? new Date()),
      });
    }

    return shift;
  }

  async closeShift(shiftId: string, payload: { closingCash?: number }, tenantId?: string): Promise<any> {
    const scope = { tenantId, requireTenant: true };
    const shift = await shiftRepository.findById(shiftId, scope);
    if (!shift) throw new NotFoundError('Shift not found.');
    if (shift.status === ShiftStatus.Closed) {
      throw new ConflictError('Shift is already closed.', 'SHIFT_ALREADY_CLOSED');
    }

    const openedAt = new Date(shift.openedAt);
    const closedAt = new Date();
    const workedMinutes = Math.max(0, Math.round((closedAt.getTime() - openedAt.getTime()) / 60000));

    const invoiceMatch: Record<string, any> = { shiftId: new Types.ObjectId(shiftId), activeState: false };
    if (tenantId) {
      invoiceMatch.tenantId = new Types.ObjectId(tenantId);
    }

    const invoiceSummary = await InvoiceModel.aggregate([
      { $match: invoiceMatch },
      { $group: { _id: null, invoicesTotal: { $sum: '$total' } } },
    ]);

    const sessionsStartedFilter: Record<string, any> = {
      shiftId: new Types.ObjectId(shiftId),
    };
    if (tenantId) {
      sessionsStartedFilter.tenantId = new Types.ObjectId(tenantId);
    }
    const sessionsStarted = await SessionModel.countDocuments(sessionsStartedFilter as any);

    const sessionsEndedFilter: Record<string, any> = {
      shiftId: new Types.ObjectId(shiftId),
      activeState: false,
      updatedAt: { $gte: openedAt, $lte: closedAt },
    };
    if (tenantId) {
      sessionsEndedFilter.tenantId = new Types.ObjectId(tenantId);
    }
    const sessionsEnded = await SessionModel.countDocuments(sessionsEndedFilter as any);

    const updatedShift = await shiftRepository.updateById(shiftId, {
      closedAt,
      closingCash: Number(payload.closingCash ?? 0),
      status: ShiftStatus.Closed,
      workedMinutes,
      invoicesTotal: Number(invoiceSummary?.[0]?.invoicesTotal ?? 0),
      sessionsStarted,
      sessionsEnded,
    } as any, scope);

    if (tenantId) {
      await AnalyticsService.recordEvent({
        tenantId,
        brancheId: String(shift.brancheId),
        shiftId,
        deviceType: 'shift',
        eventType: 'shift_closed',
        amount: Number(updatedShift?.invoicesTotal ?? 0),
        occurredAt: closedAt,
        metadata: {
          workedMinutes,
          sessionsStarted,
          sessionsEnded,
          closingCash: Number(payload.closingCash ?? 0),
        },
      });
      RealtimeService.emitToTenant(tenantId, RealtimeEvent.ShiftClosed, {
        tenantId,
        brancheId: String(shift.brancheId),
        shiftId,
        closingCash: Number(payload.closingCash ?? 0),
        workedMinutes,
        invoicesTotal: Number(updatedShift?.invoicesTotal ?? 0),
        status: ShiftStatus.Closed,
      });
      void NotificationService.queueShiftClosed({
        tenantId,
        shiftId,
        total: Number(updatedShift?.invoicesTotal ?? 0),
        workedMinutes,
        closingCash: Number(payload.closingCash ?? 0),
      }).catch((error) => {
        console.warn('Failed to queue shift closed notification', error);
      });
    }

    return updatedShift;
  }

  async getDailySummary(brancheId: string, date?: string, tenantId?: string): Promise<any> {
    const targetDate = date ? new Date(date) : new Date();
    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const shiftFilter: Record<string, any> = {
      brancheId: assertObjectId(brancheId, 'brancheId'),
      openedAt: { $gte: startDate, $lte: endDate },
      activeState: true,
    };

    if (tenantId) {
      shiftFilter.tenantId = assertObjectId(tenantId, 'tenantId');
    }

    const shifts = await ShiftModel.find(shiftFilter as any).lean();

    const summary = shifts.reduce(
      (acc, shift: any) => {
        acc.invoicesTotal += Number(shift.invoicesTotal ?? 0);
        acc.sessionsStarted += Number(shift.sessionsStarted ?? 0);
        acc.sessionsEnded += Number(shift.sessionsEnded ?? 0);
        acc.workedMinutes += Number(shift.workedMinutes ?? 0);
        return acc;
      },
      { invoicesTotal: 0, sessionsStarted: 0, sessionsEnded: 0, workedMinutes: 0, shiftsCount: shifts.length }
    );

    return { shifts, summary };
  }
}

export default new ShiftService();
