import { Types } from 'mongoose';
import ShiftModel from '../models/shift';
import InvoiceModel from '../models/invoice';
import SessionModel from '../models/session';
import { shiftRepository } from '../repositories/instances';
import { ShiftStatus } from '../enums/shift-status.enum';

class ShiftService {
  async getCurrentShift(employeeId: string, brancheId: string): Promise<any> {
    return shiftRepository.findOne({
      employeeId: new Types.ObjectId(employeeId),
      brancheId: new Types.ObjectId(brancheId),
      status: ShiftStatus.Open,
      activeState: true,
    } as any);
  }

  async openShift(payload: { employeeId: string; brancheId: string; openingCash?: number; openedBy: string }): Promise<any> {
    const currentShift = await this.getCurrentShift(payload.employeeId, payload.brancheId);
    if (currentShift) {
      throw new Error('Employee already has an open shift in this branch.');
    }

    return shiftRepository.create({
      employeeId: new Types.ObjectId(payload.employeeId),
      brancheId: new Types.ObjectId(payload.brancheId),
      openedBy: new Types.ObjectId(payload.openedBy),
      openedAt: new Date(),
      openingCash: Number(payload.openingCash ?? 0),
      status: ShiftStatus.Open,
      activeState: true,
    } as any);
  }

  async closeShift(shiftId: string, payload: { closingCash?: number }): Promise<any> {
    const shift = await shiftRepository.findById(shiftId);
    if (!shift) throw new Error('Shift not found.');
    if (shift.status === ShiftStatus.Closed) throw new Error('Shift is already closed.');

    const openedAt = new Date(shift.openedAt);
    const closedAt = new Date();
    const workedMinutes = Math.max(0, Math.round((closedAt.getTime() - openedAt.getTime()) / 60000));

    const invoiceSummary = await InvoiceModel.aggregate([
      { $match: { shiftId: new Types.ObjectId(shiftId), activeState: false } },
      { $group: { _id: null, invoicesTotal: { $sum: '$total' } } },
    ]);

    const sessionsStarted = await SessionModel.countDocuments({
      shiftId: new Types.ObjectId(shiftId),
      createdAt: { $gte: openedAt, $lte: closedAt },
    } as any);

    const sessionsEnded = await SessionModel.countDocuments({
      shiftId: new Types.ObjectId(shiftId),
      activeState: false,
      updatedAt: { $gte: openedAt, $lte: closedAt },
    } as any);

    const updatedShift = await shiftRepository.updateById(shiftId, {
      closedAt,
      closingCash: Number(payload.closingCash ?? 0),
      status: ShiftStatus.Closed,
      workedMinutes,
      invoicesTotal: Number(invoiceSummary?.[0]?.invoicesTotal ?? 0),
      sessionsStarted,
      sessionsEnded,
    } as any);

    return updatedShift;
  }

  async getDailySummary(brancheId: string, date?: string): Promise<any> {
    const targetDate = date ? new Date(date) : new Date();
    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const shifts = await ShiftModel.find({
      brancheId: new Types.ObjectId(brancheId),
      openedAt: { $gte: startDate, $lte: endDate },
      activeState: true,
    } as any).lean();

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
