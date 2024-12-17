import mongoose, {  Document } from 'mongoose';

export interface IClient extends Document {
    ownerId: mongoose.Types.ObjectId;
    brancheId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    name: string;
    phone: string;
    activeState: boolean;
    createdAt: Date;
    description: string;
  }
  