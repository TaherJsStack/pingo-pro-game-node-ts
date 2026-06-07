import mongoose, { Schema } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { IMenu } from './interfaces/menu.interface';
import { uniquePerBranch } from './plugins/unique-per-branch.plugin';

const MenuSchema: Schema<IMenu> = new Schema<IMenu>({
  ownerId:      { type: Schema.Types.ObjectId, ref: 'Auth', required: true },
  tenantId:     { type: Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
  brancheId:    { type: Schema.Types.ObjectId, ref: 'Branche', required: true },
  createdBy:    { type: Schema.Types.ObjectId, ref: 'Auth', required: true },
  name:         { type: String, required: true },
  price:        { type: Number, required: true },
  type:         { type: String, required: true },
  stock:        { type: Number, default: 0 },
  logo:         { type: String, default: '' },
  description:  { type: String, default: '' },
  activeState:  { type: Boolean, default: true },
  createdAt:    { type: Date, default: Date.now },
}, {
  timestamps: true
});

MenuSchema.plugin(uniquePerBranch, {
  path: 'name',
  scope: 'brancheId',
  message: 'Menu must be unique for brancheId combination',
});

MenuSchema.plugin(uniqueValidator);
MenuSchema.index({ tenantId: 1, brancheId: 1, name: 1 }, { unique: true });

export default mongoose.model<IMenu>('Menu', MenuSchema);
