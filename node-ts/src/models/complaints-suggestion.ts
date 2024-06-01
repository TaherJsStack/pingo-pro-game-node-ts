import mongoose, { Schema, Document } from 'mongoose';

import { IComplaintsSuggestion } from './interfaces/complaints-suggestion.interface';

const complaintsSuggestionSchema: Schema<IComplaintsSuggestion> = new Schema<IComplaintsSuggestion>({
    brancheId:    { type: Schema.Types.ObjectId, ref: 'Branche', required: true },
    name:       { type: String, default: '' },
    email:      { type: String, default: '' },
    phone:      { type: String, default: '' },
    comment:    { type: String, required: true },
    type:       { type: String, required: true },
    activeState: { type: Boolean, default: true },
    createdAt:   { type: Date, default: Date.now },
    description: { type: String, default: '' },
}, {
    timestamps: true
});



const ComplaintsSuggestion = mongoose.model<IComplaintsSuggestion>('ComplaintsSuggestion', complaintsSuggestionSchema);

export default ComplaintsSuggestion;
