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
        lat: { type: Number, default: 0, min: -90, max: 90 },
        lng: { type: Number, default: 0, min: -180, max: 180 },
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number],
            default: [0, 0],
        },
    },
    activeState: { type: Boolean, default: true },
    createdAt:   { type: Date, default: Date.now },
    description: { type: String, default: '' },
}, {
    timestamps: true
});

addressSchema.pre('validate', function(next) {
    const lat = this.coordinates?.lat ?? 0;
    const lng = this.coordinates?.lng ?? 0;

    (this as any).location = {
        type: 'Point',
        coordinates: [lng, lat],
    };

    next();
});

addressSchema.index({ location: '2dsphere' });

const AddressModel = mongoose.model<IAddress>('Address', addressSchema);

export default AddressModel;
