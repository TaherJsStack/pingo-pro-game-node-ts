import mongoose, {  Document } from 'mongoose';
import { IPermissions } from './permissions.interface';

// Define the interface for the Auth document
export interface IAuth extends Document {
    _id:          mongoose.Schema.Types.ObjectId;
    brancheId:    mongoose.Schema.Types.ObjectId;
    username:     String,
    firstName:    String;
    lastName:     String;
    email:        String;
    phone:        String;
    image:        String;
    activeState:  Boolean;
    role:         Number;
    permeation:   Number[];
    permissions:  IPermissions[];
    createdAt:    Date;
    description:  String;
    authType:     'owner' | 'employee' | 'root';
}