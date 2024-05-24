import mongoose, {  Document } from 'mongoose';

// Define the interface for the Password document
export interface IPassword extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  password: string;
  createdAt: Date;
}