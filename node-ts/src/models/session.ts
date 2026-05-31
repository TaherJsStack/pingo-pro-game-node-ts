import mongoose, { Schema } from 'mongoose';
import { ISession } from './interfaces/session.interface';

const sessionSchema: Schema<ISession> = new Schema<ISession>({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
  brancheId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branche' },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
  activeState: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  description: { type: String, default: '' },
  total: { type: Number, default: 0 },
  categoriesTotal: { type: Number, default: 0 },
  menuItemsTotal: { type: Number, default: 0 },
  categories: [
    {
      categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: false, default: null },
      closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', default: null },
      type: { type: String, default: 'open', required: true }, // open or match
      Sessiontype: { type: String, default: 'open', required: true }, // open or match
      price: { type: Number, required: true },
      startTime: { type: Date, required: true },
      endTime: { type: Date },
      estimationTime: { type: String },
      estimationInHours: { type: Number, default: 0 },
      estimationInMinutes: { type: Number, default: 0 },
    },
  ],
  menuItems: [
    {
      itemID: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', required: true },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', default: null },
      itemName: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, default: 1 },
    },
  ],
}, {
  timestamps: true
});

export default mongoose.model<ISession>('Session', sessionSchema);
