import { IPermissions } from './permissions.interface';
import { ActivityFields, BaseEntity, ObjectId } from './common.interface';

export interface IAuth extends BaseEntity, ActivityFields {
  brancheId?: ObjectId;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  image: string;
  role: number;
  permeation: number[];
  permissions: IPermissions[];
  authType: 'owner' | 'employee' | 'root' | 'client';
}
