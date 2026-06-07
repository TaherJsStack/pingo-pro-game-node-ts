import { ActivityFields, BaseEntity, ObjectId } from './common.interface';

export interface ITenant extends BaseEntity, ActivityFields {
  ownerId: ObjectId | null;
  name: string;
  slug: string;
}
