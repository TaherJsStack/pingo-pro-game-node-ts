import mongoose, { Schema } from 'mongoose';
import { IClient } from './interfaces/client.interface';
import { uniquePerBranch } from './plugins/unique-per-branch.plugin';

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

clientSchema.plugin(uniquePerBranch, {
  path: 'phone',
  scope: 'brancheId',
  message: 'Client must be unique for brancheId combination',
});

export default mongoose.model<IClient>('Client', clientSchema);
