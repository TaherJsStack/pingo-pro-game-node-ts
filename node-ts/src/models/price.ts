import mongoose, { Document, Schema } from 'mongoose';

// Legacy model kept for compatibility during the safe stabilization pass.
interface IShop extends Document {
    ownerId: string;
    brancheId: string;
    createdBy: string;
    name: string;
    type: string;
    activeState: boolean;
    createdAt: Date;
    description: string;
}

const shopSchema: Schema<IShop> = new Schema({
    ownerId: { type: String },
    brancheId: { type: String },
    name: { type: String },
    type: { type: String },
    activeState: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    description: { type: String, default: '' },
}, {
    timestamps: true
});

export default mongoose.model<IShop>('Shop', shopSchema);
