const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator')
require('mongoose-type-email');

const brancheSchema = new mongoose.Schema({
    ownerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
    branche:      { type: String,   unique: true, required: true },
    logo:         { type: String,   default: '' },
    address:      { type: String,   default: '' },
    description:  { type: String,   default: '' },
    activeState:  { type: Boolean,  default: true },
    createdAt:    { type: Date,     default: new Date() },
}, {
    timestamps: true
  });

  brancheSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Branche', brancheSchema);