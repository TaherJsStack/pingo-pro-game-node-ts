import mongoose, { Schema, Document } from 'mongoose';

import { ISettings } from './interfaces/settings.interface';

const settingsSchema: Schema<ISettings> = new Schema<ISettings>({
    ownerId:    { type: Schema.Types.ObjectId, ref: 'Auth', required: true },
    createdBy:  { type: Schema.Types.ObjectId, ref: 'Auth', required: true },
    theme:      { type: String, default: '' },
    language:   { type: String, default: '' },

    activeState: { type: Boolean, default: true },
    createdAt:   { type: Date, default: Date.now },
    description: { type: String, default: '' },
}, {
    timestamps: true
});



const Settings = mongoose.model<ISettings>('Settings', settingsSchema);

export default Settings;
