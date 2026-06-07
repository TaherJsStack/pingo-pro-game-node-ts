import { ActivityFields, BaseEntity, ObjectId } from './common.interface';
import { ShiftStatus } from '../../enums/shift-status.enum';

export { ShiftStatus };

export interface IShift extends BaseEntity, ActivityFields {
  employeeId: ObjectId;
  tenantId?: ObjectId | null;
  clientRequestId?: string;
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
