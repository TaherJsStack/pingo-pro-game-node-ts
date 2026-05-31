import { ActivityFields, BaseEntity, ObjectId } from './common.interface';

export interface IComplaintsSuggestion extends BaseEntity, ActivityFields {
  brancheId: ObjectId;
  createdBy: ObjectId;
  name: string;
  email: string;
  phone: string;
  comment: string;
  type: string;
}
