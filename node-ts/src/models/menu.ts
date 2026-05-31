import mongoose, { Schema } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { IMenu } from './interfaces/menu.interface';
import { invalidateIfDuplicate } from './helpers/uniqueness';

const MenuSchema: Schema<IMenu> = new Schema<IMenu>({
  ownerId:      { type: Schema.Types.ObjectId, ref: 'Auth', required: true },
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

MenuSchema.pre('validate', async function (next) {
  if (!this.isModified('name') && !this.isModified('brancheId')) {
    return next();
  }

  await invalidateIfDuplicate({
    model: mongoose.models.Menu,
    filter: {
      name: this.name,
      brancheId: this.brancheId,
    },
    currentId: this._id,
    invalidate: this.invalidate.bind(this),
    path: 'name',
    message: 'Menu must be unique for brancheId combination',
  });

  next();
});

MenuSchema.plugin(uniqueValidator);

export default mongoose.model<IMenu>('Menu', MenuSchema);
