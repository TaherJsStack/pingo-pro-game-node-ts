import { ActivityFields, BaseEntity, ObjectId } from './common.interface';

export interface ICounter extends BaseEntity, ActivityFields {
  tenantId: ObjectId;
  brancheId: ObjectId;
  scope: string;
  sequence: number;
}
