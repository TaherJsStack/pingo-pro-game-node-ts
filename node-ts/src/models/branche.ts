import mongoose, { Schema, Document } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

export interface IBranche extends Document {
    ownerId: mongoose.Schema.Types.ObjectId;
    branche: string;
    logo: string;
    address: string;
    description: string;
    activeState: boolean;
    createdAt: Date;
}

const brancheSchema: Schema<IBranche> = new Schema<IBranche>({
    ownerId: { type: Schema.Types.ObjectId, ref: 'Auth', required: true },
    branche: { type: String, unique: true, required: true },
    logo: { type: String, default: '' },
    address: { type: String, default: '' },
    description: { type: String, default: '' },
    activeState: { type: Boolean, default: true },
    createdAt: { type: Date, default: new Date() },
}, {
    timestamps: true
});

brancheSchema.plugin(uniqueValidator);

export default mongoose.model<IBranche>('Branche', brancheSchema);