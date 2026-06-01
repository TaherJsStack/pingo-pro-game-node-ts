import { ActivityFields, BaseEntity, ObjectId } from './common.interface';

export type ShiftStatus = 'open' | 'closed';

export interface IShift extends BaseEntity, ActivityFields {
  employeeId: ObjectId;
  brancheId: ObjectId;
  openedBy: ObjectId;
  openedAt: Date;
  closedAt: Date | null;
  openingCash: number;
  closingCash: number;
  status: ShiftStatus;
  invoicesTotal: number;
  sessionsStarted: number;
  sessionsEnded: number;
  workedMinutes: number;
}
