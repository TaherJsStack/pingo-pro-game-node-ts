import mongoose, {  Document } from 'mongoose';

export interface IInbox extends Document {
  // brancheId: mongoose.Schema.Types.ObjectId;
  ownerId: mongoose.Schema.Types.ObjectId;
  title: string;
  type: string;
  context: string;
  isSeen: boolean;
  activeState: boolean;
  createdAt: Date;
  description: string;
}
