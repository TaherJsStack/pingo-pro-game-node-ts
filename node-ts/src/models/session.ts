import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  createdBy: mongoose.Schema.Types.ObjectId;
  brancheId?: mongoose.Schema.Types.ObjectId;
  categoryId: mongoose.Schema.Types.ObjectId;
  clientId: mongoose.Schema.Types.ObjectId;
  times: number;
  startTime: string;
  endTime?: string;
  activeState: boolean;
  createdAt: Date;
  description: string;
}

const sessionSchema: Schema<ISession> = new Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
  brancheId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branche' },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  times: { type: Number, default: 0 },
  startTime: { type: String, required: true },
  endTime: { type: String },
  activeState: { type: Boolean, default: true },
  createdAt: { type: Date, default: new Date() },
  description: { type: String, default: '' },
}, {
  timestamps: true
});

export default mongoose.model<ISession>('Session', sessionSchema);