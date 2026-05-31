import mongoose, { Schema } from 'mongoose';
import { IPassword } from './interfaces/password.interface';

const PasswordSchema: Schema<IPassword> = new Schema<IPassword>({
    userId: { type: Schema.Types.ObjectId, ref: 'Auth', required: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
}, {
    timestamps: true
});

const Password = mongoose.model<IPassword>('Password', PasswordSchema);

export default Password;
