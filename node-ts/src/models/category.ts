import mongoose, { Document, Schema, Model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

export interface ICategory extends Document {
  ownerId: mongoose.Schema.Types.ObjectId;
  brancheId: mongoose.Schema.Types.ObjectId;
  category: string;
  priceId: mongoose.Schema.Types.ObjectId;
  price: number;
  type: string;
  logo: string;
  description: string;
  activeState: boolean;
  bookState: boolean;
  createdAt: Date;
}

const CategorySchema: Schema<ICategory> = new Schema<ICategory>({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
  brancheId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branche', required: true },
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