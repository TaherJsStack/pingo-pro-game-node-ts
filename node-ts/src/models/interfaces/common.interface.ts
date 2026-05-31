import { HydratedDocument, Types } from 'mongoose';

export type ObjectId = Types.ObjectId;

export interface BaseEntity {
  _id: ObjectId;
}

export interface ActivityFields {
  activeState: boolean;
  createdAt: Date;
  description: string;
}

export type ModelDocument<TSchema, TMethods = Record<string, never>> = HydratedDocument<TSchema, TMethods>;
