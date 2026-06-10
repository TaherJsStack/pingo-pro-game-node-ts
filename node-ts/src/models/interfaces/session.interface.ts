import { IDevices } from './devices.interface';
import { ActivityFields, BaseEntity, ObjectId } from './common.interface';
import { IMenuItems } from './invoice.interface';

export interface ISession extends BaseEntity, ActivityFields {
  createdBy: ObjectId;
  tenantId?: ObjectId | null;
  clientRequestId?: string;
  brancheId?: ObjectId;
  clientId?: ObjectId;
  startedShiftId?: ObjectId | null;
  closedShiftId?: ObjectId | null;
  // times: number;
  startTime: string;
  endTime?: string;
  estimationTime: string;
  estimationInHours: number;
  estimationInMinutes: number;
  total: number;
  devicesTotal: number;
  menuItemsTotal: number;
  Sessiontype: string;
  devices: IDevices[];
  menuItems: IMenuItems[];
}
