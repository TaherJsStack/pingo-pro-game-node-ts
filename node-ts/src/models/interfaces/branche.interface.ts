import { ActivityFields, BaseEntity, ObjectId } from './common.interface';

export interface IBranche extends BaseEntity, ActivityFields {
  ownerId: ObjectId;
  tenantId: ObjectId;
  branche: string;
  logo: string;
  address: string;
}
