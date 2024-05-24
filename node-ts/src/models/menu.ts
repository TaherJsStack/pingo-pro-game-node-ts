import mongoose, { Document, Schema, Model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { IMenu } from './interfaces/menu.interface';

const MenuSchema: Schema<IMenu> = new Schema<IMenu>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'Auth', required: true },
  brancheId: { type: Schema.Types.ObjectId, ref: 'Branche', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  type: { type: String, required: true },
  logo: { type: String, default: '' },
  description: { type: String, default: '' },
  activeState: { type: Boolean, default: true },
  createdAt: { type: Date, default: new Date() },
}, {
  timestamps: true
});

// Custom validation to check uniqueness of menu for ownerId and brancheId combination
MenuSchema.pre('validate', async function (next) {
  const existingMenu = await mongoose.models.Menu.findOne({
    name: this.name,
    brancheId: this.brancheId,
  });

  if (existingMenu) {
    const error = new Error('Menu must be unique for brancheId combination');
    this.invalidate('menu', error.message);
  }

  next();
});

MenuSchema.plugin(uniqueValidator);

const MenuModel: Model<IMenu> = mongoose.model<IMenu>('Menu', MenuSchema);
export default MenuModel;