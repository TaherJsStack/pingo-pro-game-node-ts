import { DeviceType } from '../../enums/device-type.enum';
import { ActivityFields, BaseEntity, ObjectId } from './common.interface';

export interface IDevice extends BaseEntity, ActivityFields {
  ownerId: ObjectId;
  tenantId?: ObjectId | null;
  brancheId: ObjectId;
  createdBy: ObjectId;
  name: string;
  price: number;
  type: DeviceType;
  mode: 'single' | 'multi';
  logo: string;
  bookState: boolean;
}
