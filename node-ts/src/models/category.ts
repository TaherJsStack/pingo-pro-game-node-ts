import mongoose, { Schema, Model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { ICategory } from './interfaces/category.interface';

const CategorySchema: Schema<ICategory> = new Schema<ICategory>({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
  brancheId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branche', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
  category: { type: String, required: true },
  priceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pricing', required: true },
  price: { type: Number, default: 0 },
  type: { type: String, required: true },
  logo: { type: String, default: '' },
  description: { type: String, default: '' },
  activeState: { type: Boolean, default: true },
  bookState: { type: Boolean, default: false },
  createdAt: { type: Date, default: new Date() },
}, {
  timestamps: true
});

// Custom validation to check uniqueness of category for ownerId and brancheId combination
CategorySchema.pre<ICategory>('validate', async function (next: any) {
  const existingCategory = await mongoose.models.Category.findOne({
    category: next.category,
    brancheId: next.brancheId,
  });

  if (existingCategory) {
    const error = new Error('Category must be unique for brancheId combination');
    next.invalidate('category', error.message);
  }

  next();
});

CategorySchema.plugin(uniqueValidator);

const CategoryModel: Model<ICategory> = mongoose.model<ICategory>('Category', CategorySchema);
export default CategoryModel;