import mongoose, { Schema } from 'mongoose';

import { IComplaintsSuggestion } from './interfaces/complaints-suggestion.interface';
import { optionalEmailValidator } from './helpers/validators';

const complaintsSuggestionSchema: Schema<IComplaintsSuggestion> = new Schema<IComplaintsSuggestion>({
    tenantId:     { type: Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
    brancheId:    { type: Schema.Types.ObjectId, ref: 'Branche', required: true },
    createdBy:    { type: Schema.Types.ObjectId, ref: 'Auth', required: true },
    name:         { type: String, default: '' },
    email:        { type: String, default: '', validate: optionalEmailValidator },
    phone:        { type: String, default: '' },
    comment:      { type: String, required: true },
    type:         { type: String, required: true },
    activeState:  { type: Boolean, default: true },
    createdAt:    { type: Date, default: Date.now },
    description:  { type: String, default: '' },
}, {
    timestamps: true
});
complaintsSuggestionSchema.index({ tenantId: 1, brancheId: 1, createdAt: -1 });

const ComplaintsSuggestion = mongoose.model<IComplaintsSuggestion>('ComplaintsSuggestion', complaintsSuggestionSchema);

export default ComplaintsSuggestion;
