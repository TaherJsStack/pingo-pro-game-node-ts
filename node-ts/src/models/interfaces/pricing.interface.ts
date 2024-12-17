import mongoose, {  Document } from 'mongoose';

export interface IPricing extends Document {
  brancheId: mongoose.Schema.Types.ObjectId;
  ownerId: mongoose.Schema.Types.ObjectId;
  createdBy: mongoose.Schema.Types.ObjectId;
  title: string;
  price: number;
  type: string;
  activeState: boolean;
  createdAt: Date;
  description: string;
}
