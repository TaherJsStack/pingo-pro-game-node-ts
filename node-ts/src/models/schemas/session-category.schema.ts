import mongoose, { Schema } from 'mongoose';
import { ISessionCategory } from '../interfaces/session-category.interface';

export const sessionCategorySchema: Schema<ISessionCategory> = new Schema<ISessionCategory>(
  {
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: false, default: null },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', default: null },
    type: { type: String, default: 'open', required: true },
    Sessiontype: { type: String, default: 'open', required: true },
    pricingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pricing', default: null },
    pricingMode: { type: String, default: 'hourly' },
    price: { type: Number, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    estimationTime: { type: String },
    estimationInHours: { type: Number, default: 0 },
    estimationInMinutes: { type: Number, default: 0 },
  },
  { _id: false }
);
