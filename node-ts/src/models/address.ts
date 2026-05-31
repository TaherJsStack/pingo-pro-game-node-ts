import mongoose, { Schema } from 'mongoose';
import { IAddress } from './interfaces/address.interface';

const addressSchema: Schema<IAddress> = new Schema<IAddress>({
    ownerId:    { type: Schema.Types.ObjectId, ref: 'Auth', required: true },
    country:    { type: String, default: '' },
    address:    { type: String, default: '' },
    city:       { type: String, default: '' },
    postalCode: { type: String, default: '' },
    state:      { type: String, default: '' },
    coordinates: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 },
    },
    activeState: { type: Boolean, default: true },
    createdAt:   { type: Date, default: Date.now },
    description: { type: String, default: '' },
}, {
    timestamps: true
});



const AddressModel = mongoose.model<IAddress>('Address', addressSchema);

export default AddressModel;
