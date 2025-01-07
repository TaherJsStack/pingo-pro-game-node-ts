import mongoose, {  Document } from 'mongoose';

export interface IMenu extends Document {
  ownerId: mongoose.Types.ObjectId;
  brancheId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  name: string;
  price: number;
  type: string;
  stock: number;
  logo: string;
  description: string;
  activeState: boolean;
  createdAt: Date;
}