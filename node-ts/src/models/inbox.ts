import mongoose, { Schema } from 'mongoose';
import { IInbox } from './interfaces/inbox.interface';
import { InboxType } from '../enums/inbox-type.enum';

const inboxTypeEnum = Object.values(InboxType);

const inboxSchema: Schema<IInbox> = new Schema<IInbox>({
    ownerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
    title:        { type: String,  required: true },
    type:         { type: String,  enum: inboxTypeEnum, required: true },
    context:      { type: String,  required: true },
    isSeen:       { type: Boolean, default: false },
    activeState:  { type: Boolean, default: true },
    createdAt:    { type: Date,    default: Date.now },
    description:  { type: String,  default: ''},
}, {
    timestamps: true
});

export default mongoose.model<IInbox>('Inbox', inboxSchema);
