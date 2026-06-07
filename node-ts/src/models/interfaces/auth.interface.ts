import { IPermissions } from './permissions.interface';
import { ActivityFields, BaseEntity, ObjectId } from './common.interface';
import { AuthType } from '../../enums/auth-type.enum';

export interface IAuth extends BaseEntity, ActivityFields {
  brancheId?: ObjectId;
  tenantId?: ObjectId | null;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  image: string;
  role: number;
  permission: number[];
  permissions: IPermissions[];
  authType: AuthType;
}
