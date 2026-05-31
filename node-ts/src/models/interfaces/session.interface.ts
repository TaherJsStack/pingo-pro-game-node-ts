import { ICategories } from './categories.interface';
import { ActivityFields, BaseEntity, ObjectId } from './common.interface';
import { IMenuItems } from './invoice.interface';

export interface ISession extends BaseEntity, ActivityFields {
  createdBy: ObjectId;
  brancheId?: ObjectId;
  clientId?: ObjectId;
  // times: number;
  startTime: string;
  endTime?: string;
  estimationTime: string;
  estimationInHours: number;
  estimationInMinutes: number;
  total: number;
  categoriesTotal: number;
  menuItemsTotal: number;
  Sessiontype: string;
  categories: ICategories[];
  menuItems: IMenuItems[];
}
