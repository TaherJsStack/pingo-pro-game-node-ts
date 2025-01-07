import mongoose, { Schema, Document } from 'mongoose';
import { IClient } from './interfaces/client.interface';

const clientSchema: Schema<IClient> = new Schema<IClient>({
  ownerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
  brancheId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Branche', required: true },
  name:        { type: String, required: true },
  phone:       { type: String, required: true },
  activeState: { type: Boolean, default: true },
  createdAt:   { type: Date, default: new Date() },
  description: { type: String, default: '' },
}, {
  timestamps: true
});

clientSchema.index({ name: 'text', description: 'text' });

// Custom validation to check uniqueness 
clientSchema.pre('validate', async function(this: IClient, next) {
  const existing = await mongoose.models.Client.findOne({
    phone: this.phone,
    brancheId: this.brancheId,
  });

  if (existing) {
    const error = new Error('Client must be unique for brancheId combination');
    this.invalidate('Client', error.message);
  }

  next();
});



export default mongoose.model<IClient>('Client', clientSchema);