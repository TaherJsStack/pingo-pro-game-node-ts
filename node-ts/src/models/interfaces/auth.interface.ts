import mongoose, {  Document } from 'mongoose';

// Define the interface for the Auth document
export interface IAuth extends Document {
    _id:      mongoose.Schema.Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    image: string;
    activeState: boolean;
    role: number;
    permeation: number[];
    createdAt: Date;
    description: string;
    authType: string;
    brancheId: mongoose.Schema.Types.ObjectId;
}