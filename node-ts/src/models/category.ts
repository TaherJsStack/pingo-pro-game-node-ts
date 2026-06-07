import mongoose, { Schema } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { ICategory } from './interfaces/category.interface';
import { uniquePerBranch } from './plugins/unique-per-branch.plugin';

const CategorySchema: Schema<ICategory> = new Schema<ICategory>({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
  brancheId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branche', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
  category: { type: String, required: true },
  price: { type: Number, default: 0 },
  type: { type: String, required: true },
  logo: { type: String, default: '' },
  description: { type: String, default: '' },
  activeState: { type: Boolean, default: true },
  bookState: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, {
  timestamps: true
});

CategorySchema.plugin(uniquePerBranch, {
  path: 'category',
  scope: 'brancheId',
  message: 'Category must be unique for brancheId combination',
});

CategorySchema.plugin(uniqueValidator);
CategorySchema.index({ tenantId: 1, brancheId: 1, category: 1 }, { unique: true });

export default mongoose.model<ICategory>('Category', CategorySchema);
