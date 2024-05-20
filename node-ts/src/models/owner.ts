import mongoose, { Schema, Document } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
// import { Email } from 'mongoose-type-email';

interface IOwner extends Document {
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

const ownerSchema: Schema = new Schema<IOwner>({
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