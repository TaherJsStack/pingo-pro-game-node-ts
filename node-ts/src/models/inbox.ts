import mongoose, { Schema, Document } from 'mongoose';
import { IInbox } from './interfaces/inbox.interface';

const inboxSchema: Schema<IInbox> = new Schema({
    // brancheId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Branche', required: true },
    ownerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
    title:        { type: String,  required: true },
    type:         { type: String,  required: true },
    context:      { type: String,  required: true },
    isSeen:       { type: Boolean, default: false },
    activeState:  { type: Boolean, default: true },
    createdAt:    { type: Date,    default: new Date() },
    description:  { type: String,  default: ''},
}, {
    timestamps: true
});


mongoose.model<IInbox>('Inbox', inboxSchema);

export default mongoose.model<IInbox>('Inbox');