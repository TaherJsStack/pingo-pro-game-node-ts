import mongoose, {  Document } from 'mongoose';

export interface ISession extends Document {
  createdBy: mongoose.Schema.Types.ObjectId;
  brancheId?: mongoose.Schema.Types.ObjectId;
  categoryId: mongoose.Schema.Types.ObjectId;
  clientId: mongoose.Schema.Types.ObjectId;
  times: number;
  startTime: string;
  endTime?: string;
  activeState: boolean;
  createdAt: Date;
  description: string;
}