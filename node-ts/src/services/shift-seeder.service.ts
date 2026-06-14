import { Types } from 'mongoose';
import ShiftModel from '../models/shift';
import { authRepository, shiftRepository } from '../repositories/instances';
import { AuthType } from '../enums/auth-type.enum';
import { ShiftStatus } from '../enums/shift-status.enum';
import { IShiftSeedParams, IShiftSeedResult } from '../models/interfaces/shift-seeder.interface';

class ShiftSeederService {
  private rand(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  private buildShift(params: {
    employeeId: string;
    tenantId: string;
    brancheId: string;
    openedBy: string;
    date: Date;
  }) {
    const { employeeId, tenantId, brancheId, openedBy, date } = params;
    const openedAt = new Date(date);
    openedAt.setHours(this.rand(7, 10), this.rand(0, 59), 0, 0);
    const workedMinutes = this.rand(360, 540);
    const closedAt = new Date(openedAt.getTime() + workedMinutes * 60_000);
    const openingCash = this.rand(500, 2000);
    const sessionsStarted = this.rand(5, 20);

    return {
      employeeId: new Types.ObjectId(employeeId),
      tenantId: new Types.ObjectId(tenantId),
      brancheId: new Types.ObjectId(brancheId),
      openedBy: new Types.ObjectId(openedBy),
      openedAt,
      closedAt,
      openingCash,
      closingCash: openingCash + this.rand(200, 1000),
      invoicesTotal: this.rand(1000, 8000),
      sessionsStarted,
      sessionsEnded: Math.max(0, sessionsStarted - this.rand(0, 3)),
      workedMinutes,
      status: ShiftStatus.Closed,
      activeState: true,
    };
  }

  async seedForBranch(params: IShiftSeedParams): Promise<IShiftSeedResult> {
    const { tenantId, brancheId, openedBy, monthsBack } = params;
    const scope = { tenantId, requireTenant: true };

    const employees = await authRepository.find(
      {
        authType: AuthType.Employee,
        brancheId: new Types.ObjectId(brancheId),
        activeState: true,
      },
      { scope }
    );

    if (employees.length === 0) {
      return { created: 0, skipped: 0, employeeCount: 0 };
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const startFrom = new Date();
    startFrom.setMonth(startFrom.getMonth() - monthsBack);
    startFrom.setHours(0, 0, 0, 0);

    let created = 0;
    let skipped = 0;
    const toInsert: ReturnType<typeof this.buildShift>[] = [];

    for (const employee of employees) {
      const cursor = new Date(startFrom);

      while (cursor <= today) {
        if (this.isWeekend(cursor) || Math.random() < 0.12) {
          cursor.setDate(cursor.getDate() + 1);
          continue;
        }

        const dayStart = new Date(cursor);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(cursor);
        dayEnd.setHours(23, 59, 59, 999);

        const existing = await shiftRepository.findOne(
          {
            employeeId: new Types.ObjectId(String(employee._id)),
            brancheId: new Types.ObjectId(brancheId),
            openedAt: { $gte: dayStart, $lte: dayEnd },
          },
          scope
        );

        if (existing) {
          skipped++;
        } else {
          toInsert.push(
            this.buildShift({
              employeeId: String(employee._id),
              tenantId,
              brancheId,
              openedBy,
              date: new Date(cursor),
            })
          );
          created++;
        }

        cursor.setDate(cursor.getDate() + 1);
      }
    }

    if (toInsert.length > 0) {
      await ShiftModel.insertMany(toInsert, { ordered: false });
    }

    return { created, skipped, employeeCount: employees.length };
  }
}

export default new ShiftSeederService();
