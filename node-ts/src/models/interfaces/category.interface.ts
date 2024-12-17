import mongoose, {  Document } from 'mongoose';


export interface ICategory extends Document {
    ownerId: mongoose.Schema.Types.ObjectId;
    brancheId: mongoose.Schema.Types.ObjectId;
    createdBy: mongoose.Schema.Types.ObjectId;
    category: string;
    priceId: mongoose.Schema.Types.ObjectId;
    price: number;
    type: string;
    logo: string;
    description: string;
    activeState: boolean;
    bookState: boolean;
    createdAt: Date;
  }