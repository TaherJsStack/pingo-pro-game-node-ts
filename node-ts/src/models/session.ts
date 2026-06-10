import mongoose, { Schema } from 'mongoose';
import { ISession } from './interfaces/session.interface';
import { menuItemSchema } from './schemas/menu-item.schema';
import { sessionDeviceSchema } from './schemas/session-device.schema';

const sessionSchema: Schema<ISession> = new Schema<ISession>({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
  clientRequestId: { type: String, trim: true, index: true },
  brancheId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branche' },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
  startedShiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', default: null },
  closedShiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', default: null },
  activeState: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  description: { type: String, default: '' },
  total: { type: Number, default: 0 },
  devicesTotal: { type: Number, default: 0 },
  menuItemsTotal: { type: Number, default: 0 },
  devices: [sessionDeviceSchema],
  menuItems: [menuItemSchema],
}, {
  timestamps: true,
      toJSON: {
      transform(_doc, ret) {
        const devicesTotal = (ret.devices ?? []).reduce((sum: number, d: any) => sum + (d.price || 0), 0);
        const menuItemsTotal = (ret.menuItems ?? []).reduce(
          (sum: number, m: any) => sum + (m.quantity || 0) * (m.price || 0),
          0
        );
        ret.devicesTotal = devicesTotal;
        ret.menuItemsTotal = menuItemsTotal;
        ret.total = devicesTotal + menuItemsTotal;
        return ret;
      },
    },
});

sessionSchema.index({ tenantId: 1, brancheId: 1, createdAt: -1 });
sessionSchema.index({ tenantId: 1, startedShiftId: 1, activeState: 1, createdAt: -1 });
sessionSchema.index({ tenantId: 1, activeState: 1, createdAt: -1 });
sessionSchema.index(
  { tenantId: 1, clientRequestId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      clientRequestId: { $exists: true, $type: 'string' },
    },
  }
);

export default mongoose.model<ISession>('Session', sessionSchema);
