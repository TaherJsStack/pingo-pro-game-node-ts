import { ObjectId } from './common.interface';

export interface ICategories {
  categoryId: ObjectId;
  createdBy?: ObjectId | null;
  closedBy?: ObjectId | null;
  type: string;
  price: number;
  startTime: string;
  endTime?: string;
  estimationTime?: string;
  estimationInHours: number;
  estimationInMinutes: number;
}
