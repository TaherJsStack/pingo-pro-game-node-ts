import { IPermissions } from './interfaces/permissions.interface';
import mongoose, { Schema } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { IAuth } from './interfaces/auth.interface';

const authSchema: Schema<IAuth> = new Schema<IAuth>({
    username:    { type: String, default: 'Default' },
    firstName:   { type: String, default: 'Default' },
    lastName:    { type: String, default: 'Default' },
    email:       { type: Schema.Types.String, required: true, unique: true, match: /.+\@.+\..+/ },
    phone:       { type: String, default: '' },
    image:       { type: String, default: '' },
    activeState: { type: Boolean, default: true },
    role:        { type: Number, required: true, default: 2 },
    permeation:  { type: [Number], required: true, default: [2] },
    createdAt:   { type: Date, default: Date.now },
    description: { type: String, default: '' },
    authType:    { type: String, default: 'owner' }, // owner or employee or root
    brancheId:   { type: Schema.Types.ObjectId, ref: 'Branche' },
    permissions: {  type: [
        {
          pageName: { type: String,  required: true },
          read:     { type: Boolean, default: false },
          write:    { type: Boolean, default: false },
          execute:  { type: Boolean, default: false },
        },
      ],
      default: []
    }
}, {
    timestamps: true
});


authSchema.plugin(uniqueValidator);

const Auth = mongoose.model<IAuth>('Auth', authSchema);

export default Auth;
