import mongoose, {  Document } from 'mongoose';

export interface ICategories extends Document {
  categoryId: mongoose.Types.ObjectId;
  type: string;
  price: number;
  startTime: string;
  endTime?: string;
  estimationTime: String;
  estimationInHours: number;
  estimationInMinutes: number;
}
