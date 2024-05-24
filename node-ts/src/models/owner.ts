import mongoose, { Schema, Document } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { IOwner } from './interfaces/owner.interface';
// import { Email } from 'mongoose-type-email';

const ownerSchema: Schema<IOwner> = new Schema<IOwner>({
    name: { type: String },
    email: { type: String, required: true, unique: true, validate: /^\S+@\S+\.\S+$/ },
    role: { type: Number, required: true, default: 3 },
    permeation: { type: [Number], required: true, default: [3] },
    imageUrl: { type: String, default: '' },
    activeState: { type: Boolean, default: true },
    createdAt: { type: Date, default: new Date() },
    description: { type: String, default: '' },
    governorate: { type: String, default: '' },
    city: { type: String, default: '' },
    area: { type: String, default: '' },
    mobile: { type: String, default: '' },
    floorNo: { type: String, default: '' },
    streetNo: { type: String, default: '' },
    buildingNo: { type: String, default: '' },
    apartmentNo: { type: String, default: '' },
    title: { type: String, default: '' },
    imgPath: { type: String, default: '' },
    showInWebSite: { type: Boolean, default: false },
}, {
    timestamps: true
});

ownerSchema.plugin(uniqueValidator);

export default mongoose.model<IOwner>('Owner', ownerSchema);