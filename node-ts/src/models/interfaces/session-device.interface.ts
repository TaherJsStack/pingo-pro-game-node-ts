import { DeviceType } from '../../enums/device-type.enum';
import { ObjectId } from './common.interface';

export interface ISessionDevice {
  deviceId: ObjectId;
  createdBy?: ObjectId | null;
  closedBy?: ObjectId | null;
  type: DeviceType;
  Sessiontype?: string;
  mode?: 'single' | 'multi';
  price: number;
  startTime: Date;
  endTime?: Date;
  estimationTime?: string;
  estimationInHours: number;
  estimationInMinutes: number;
}
