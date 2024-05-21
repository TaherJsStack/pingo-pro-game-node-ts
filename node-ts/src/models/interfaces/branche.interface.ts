import mongoose, {  Document } from 'mongoose';

export interface IBranche extends Document {
    ownerId: mongoose.Schema.Types.ObjectId;
    branche: string;
    logo: string;
    address: string;
    description: string;
    activeState: boolean;
    createdAt: Date;
}