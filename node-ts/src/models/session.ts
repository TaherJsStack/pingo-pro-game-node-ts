import mongoose, { Schema } from 'mongoose';
import { ISession } from './interfaces/session.interface';
import { menuItemSchema } from './schemas/menu-item.schema';
import { sessionCategorySchema } from './schemas/session-category.schema';

const sessionSchema: Schema<ISession> = new Schema<ISession>({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
  brancheId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branche' },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
  shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', default: null },
  activeState: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  description: { type: String, default: '' },
  total: { type: Number, default: 0 },
  categoriesTotal: { type: Number, default: 0 },
  menuItemsTotal: { type: Number, default: 0 },
  categories: [sessionCategorySchema],
  menuItems: [menuItemSchema],
}, {
  timestamps: true
});

export default mongoose.model<ISession>('Session', sessionSchema);
