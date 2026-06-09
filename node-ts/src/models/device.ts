import mongoose, { Schema } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { IDevice } from './interfaces/device.interface';
import { uniquePerBranch } from './plugins/unique-per-branch.plugin';
import { DeviceType } from '../enums/device-type.enum';

const DeviceSchema: Schema<IDevice> = new Schema<IDevice>({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
  brancheId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branche', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  priceMulti: { type: Number, default: 0 },
  type: { type: String, enum: Object.values(DeviceType), required: true },
  mode: { type: String, enum: ['single', 'multi'], default: 'single' },
  logo: { type: String, default: '' },
  description: { type: String, default: '' },
  activeState: { type: Boolean, default: true },
  bookState: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, {
  timestamps: true
});

DeviceSchema.plugin(uniquePerBranch, {
  path: 'name',
  scope: 'brancheId',
  message: 'Device name must be unique for brancheId combination',
});

DeviceSchema.plugin(uniqueValidator);
DeviceSchema.index({ tenantId: 1, brancheId: 1, name: 1 }, { unique: true });

export default mongoose.model<IDevice>('Device', DeviceSchema);
