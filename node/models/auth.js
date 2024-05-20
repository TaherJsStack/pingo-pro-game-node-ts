const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator')
require('mongoose-type-email');

const authSchema = new mongoose.Schema({
    firstName:      { type: String,  default: 'Default' },
    lastName:       { type: String,  default: 'Default' },
    email:          { type: mongoose.SchemaTypes.Email, required: true, unique: true },
    phone:          { type: String,   default: ''},
    image:          { type: String,   default: ''},
    activeState:    { type: Boolean,  default:  true },
    role:           { type: Number,   required: true, default: 2 },
    permeation:     { type: [Number], required: true, default: [2] },
    createdAt:      { type: Date,     default:  new Date() },
    description:    { type: String,   default: ''},

    authType:       { type: String, default: 'owner' }, // owner or employee or root
    brancheId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Branche'},
    
}, {
    timestamps: true
  });


authSchema.plugin(uniqueValidator)

module.exports = mongoose.model('Auth', authSchema);