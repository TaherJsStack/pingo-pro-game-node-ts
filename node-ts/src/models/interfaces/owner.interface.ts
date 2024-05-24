import mongoose, {  Document } from 'mongoose';

export interface IOwner extends Document {
  name: string;
  email: string;
  role: number;
  permeation: number[];
  imageUrl: string;
  activeState: boolean;
  createdAt: Date;
  description: string;
  governorate: string;
  city: string;
  area: string;
  mobile: string;
  floorNo: string;
  streetNo: string;
  buildingNo: string;
  apartmentNo: string;
  title: string;
  imgPath: string;
  showInWebSite: boolean;
}