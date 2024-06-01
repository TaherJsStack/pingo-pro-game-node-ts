import mongoose, {  Document } from 'mongoose';

export interface IComplaintsSuggestion extends Document {
  brancheId:   mongoose.Types.ObjectId;
  name:        string;
  email:       string;
  phone:       string;
  comment:     string;
  type:        string;
  activeState: Boolean;
  createdAt:   Date;
  description: String;
}
