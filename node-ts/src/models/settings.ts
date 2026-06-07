import mongoose, { Schema } from 'mongoose';

import { ISettings } from './interfaces/settings.interface';
import { NotificationChannel } from '../enums/notification-channel.enum';

const settingsSchema: Schema<ISettings> = new Schema<ISettings>({
    ownerId:    { type: Schema.Types.ObjectId, ref: 'Auth', required: true },
    createdBy:  { type: Schema.Types.ObjectId, ref: 'Auth', required: true },
    tenantId:   { type: Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
    theme:      { type: String, default: '' },
    language:   { type: String, default: '' },
    receipt: {
      paperSize: { type: String, enum: ['58mm', '80mm'], default: '80mm' },
      headerText: { type: String, default: 'Pingo Pro Game' },
      footerText: { type: String, default: 'Thank you for your visit' },
      showLogo: { type: Boolean, default: true },
    },
    notifications: {
      enabled: { type: Boolean, default: false },
      channels: [{ type: String, enum: Object.values(NotificationChannel), default: [] }],
      whatsappNumber: { type: String, default: '' },
      telegramChatId: { type: String, default: '' },
      shiftOpened: { type: Boolean, default: true },
      shiftClosed: { type: Boolean, default: true },
      tableClosed: { type: Boolean, default: true },
      dailySummary: { type: Boolean, default: false },
      tableCloseThreshold: { type: Number, default: 0 },
    },

    activeState: { type: Boolean, default: true },
    createdAt:   { type: Date, default: Date.now },
    description: { type: String, default: '' },
}, {
    timestamps: true
});



const Settings = mongoose.model<ISettings>('Settings', settingsSchema);

export default Settings;
