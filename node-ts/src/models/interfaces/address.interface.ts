import mongoose, {  Document } from 'mongoose';

export interface IAddress extends Document {
  ownerId:    mongoose.Types.ObjectId;
  country:    string;
  address:    string;
  city:       string;
  postalCode: string;
  state:      string;
  coordinates: {
      lat: number;
      lng: number;
  },
  activeState: Boolean;
  createdAt:   Date;
  description: String;
}
