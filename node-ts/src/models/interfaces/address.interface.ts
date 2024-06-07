import mongoose, {  Document } from 'mongoose';

export interface IAddress extends Document {
  ownerId:    mongoose.Types.ObjectId;
  country:    string;
  address:    string;
  city:       string;
  postalCode: string;
  state:      string;
  activeState: Boolean;
  createdAt:   Date;
  description: String;
  coordinates: {
      lat: number;
      lng: number;
  },
}
