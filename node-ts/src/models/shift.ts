import mongoose, { Model, Schema } from 'mongoose';
import { IShift } from './interfaces/shift.interface';
import { ShiftStatus } from '../enums/shift-status.enum';

type ShiftModel = Model<IShift>;

const shiftSchema: Schema<IShift, ShiftModel> = new Schema<IShift, ShiftModel>(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
    clientRequestId: { type: String, trim: true, index: true },
    brancheId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branche', required: true },
    openedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', default: null },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date, default: null },
    openingCash: { type: Number, default: 0 },
    closingCash: { type: Number, default: 0 },
    status: { type: String, enum: Object.values(ShiftStatus), default: ShiftStatus.Open },
    invoicesTotal: { type: Number, default: 0 },
    sessionsStarted: { type: Number, default: 0 },
    sessionsEnded: { type: Number, default: 0 },
    workedMinutes: { type: Number, default: 0 },
    activeState: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    description: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

shiftSchema.index({ tenantId: 1, brancheId: 1, openedAt: -1 });
shiftSchema.index({ tenantId: 1, status: 1, openedAt: -1 });
shiftSchema.index({ tenantId: 1, employeeId: 1, status: 1, openedAt: -1 });
shiftSchema.index(
  { tenantId: 1, clientRequestId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      clientRequestId: { $exists: true, $type: 'string' },
    },
  }
);

const Shift: ShiftModel = mongoose.model<IShift, ShiftModel>('Shift', shiftSchema);

export default Shift;
