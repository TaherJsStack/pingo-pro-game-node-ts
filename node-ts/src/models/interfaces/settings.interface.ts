import mongoose, {  Document } from 'mongoose';

export interface ISettings extends Document {
  ownerId:    mongoose.Types.ObjectId;
  createdBy:  mongoose.Types.ObjectId;
  theme:      string;
  language:   string;

  activeState: Boolean;
  createdAt:   Date;
  description: String;
}
