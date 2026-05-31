import mongoose, { Schema } from 'mongoose';
import { IClient } from './interfaces/client.interface';
import { invalidateIfDuplicate } from './helpers/uniqueness';

const clientSchema: Schema<IClient> = new Schema<IClient>({
  ownerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
  brancheId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Branche', required: true },
  name:        { type: String, required: true },
  phone:       { type: String, required: true },
  activeState: { type: Boolean, default: true },
  createdAt:   { type: Date, default: Date.now },
  description: { type: String, default: '' },
}, {
  timestamps: true
});

clientSchema.index({ name: 'text', description: 'text' });

clientSchema.pre('validate', async function(next) {
  if (!this.isModified('phone') && !this.isModified('brancheId')) {
    return next();
  }

  await invalidateIfDuplicate({
    model: mongoose.models.Client,
    filter: {
      phone: this.phone,
      brancheId: this.brancheId,
    },
    currentId: this._id,
    invalidate: this.invalidate.bind(this),
    path: 'phone',
    message: 'Client must be unique for brancheId combination',
  });

  next();
});



export default mongoose.model<IClient>('Client', clientSchema);
