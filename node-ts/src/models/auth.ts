import mongoose, { Schema, Document } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
// import 'mongoose-type-email';

// Define the interface for the Auth document
export interface IAuth extends Document {
    _id:      mongoose.Schema.Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    image: string;
    activeState: boolean;
    role: number;
    permeation: number[];
    createdAt: Date;
    description: string;
    authType: string;
    brancheId: mongoose.Schema.Types.ObjectId;
}

const authSchema: Schema = new Schema({
    firstName: { type: String, default: 'Default' },
    lastName: { type: String, default: 'Default' },
    email: { type: Schema.Types.String, required: true, unique: true, match: /.+\@.+\..+/ },
    phone: { type: String, default: '' },
    image: { type: String, default: '' },
    activeState: { type: Boolean, default: true },
    role: { type: Number, required: true, default: 2 },
    permeation: { type: [Number], required: true, default: [2] },
    createdAt: { type: Date, default: Date.now },
    description: { type: String, default: '' },
    authType: { type: String, default: 'owner' }, // owner or employee or root
    brancheId: { type: Schema.Types.ObjectId, ref: 'Branche' },
}, {
    timestamps: true
});

authSchema.plugin(uniqueValidator);

const Auth = mongoose.model<IAuth>('Auth', authSchema);

export default Auth;
