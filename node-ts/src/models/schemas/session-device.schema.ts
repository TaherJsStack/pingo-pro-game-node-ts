import mongoose, { Schema } from 'mongoose';
import { ISessionDevice } from '../interfaces/session-device.interface';
import { DeviceType } from '../../enums/device-type.enum';

export const sessionDeviceSchema: Schema<ISessionDevice> = new Schema<ISessionDevice>(
  {
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: false, default: null },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', default: null },
    // Device type (room/pc/xbox/ping-pong/billiards) — used for analytics grouping.
    type: { type: String, enum: Object.values(DeviceType), default: DeviceType.ROOM, required: true },
    // Session mode: 'open' (no-time, accrues live) vs 'timed' (has an estimation/endTime).
    Sessiontype: { type: String, default: 'open', required: true },
    mode: { type: String, enum: ['single', 'multi'], default: 'single' },
    price: { type: Number, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    estimationTime: { type: String },
    estimationInHours: { type: Number, default: 0 },
    estimationInMinutes: { type: Number, default: 0 },
  },
  { _id: true }
);
