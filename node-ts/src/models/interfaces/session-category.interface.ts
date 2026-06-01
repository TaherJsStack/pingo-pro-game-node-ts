import { ObjectId } from './common.interface';

export interface ISessionCategory {
  categoryId: ObjectId;
  createdBy?: ObjectId | null;
  closedBy?: ObjectId | null;
  type: string;
  Sessiontype?: string;
  price: number;
  startTime: Date;
  endTime?: Date;
  estimationTime?: string;
  estimationInHours: number;
  estimationInMinutes: number;
}
