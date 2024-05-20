import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for the Password document
export interface IPassword extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    password: string;
    createdAt: Date;
}

const PasswordSchema: Schema<IPassword> = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'Auth', required: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
}, {
    timestamps: true
});

const Password = mongoose.model<IPassword>('Password', PasswordSchema);

export default Password;
