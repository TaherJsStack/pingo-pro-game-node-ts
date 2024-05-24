import mongoose, {  Document } from 'mongoose';

export interface ICategories extends Document {
  category: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  type: string;
  price: number;
  startIn: string;
  endIn?: string;
}
