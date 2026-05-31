import { BaseEntity, ObjectId } from './common.interface';

export interface IPassword extends BaseEntity {
  userId: ObjectId;
  password: string;
  createdAt: Date;
}
