import mongoose, { Schema } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { ICategory } from './interfaces/category.interface';
import { invalidateIfDuplicate } from './helpers/uniqueness';

const CategorySchema: Schema<ICategory> = new Schema<ICategory>({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
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

CategorySchema.pre('validate', async function (next) {
  if (!this.isModified('category') && !this.isModified('brancheId')) {
    return next();
  }

  await invalidateIfDuplicate({
    model: mongoose.models.Category,
    filter: {
      category: this.category,
      brancheId: this.brancheId,
    },
    currentId: this._id,
    invalidate: this.invalidate.bind(this),
    path: 'category',
    message: 'Category must be unique for brancheId combination',
  });

  next();
});

CategorySchema.plugin(uniqueValidator);

export default mongoose.model<ICategory>('Category', CategorySchema);
