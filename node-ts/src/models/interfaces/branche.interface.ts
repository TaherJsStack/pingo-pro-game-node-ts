import { ActivityFields, BaseEntity, ObjectId } from './common.interface';

export interface IBranche extends BaseEntity, ActivityFields {
  ownerId: ObjectId;
  branche: string;
  logo: string;
  address: string;
}
