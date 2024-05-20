const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator')
require('mongoose-type-email');

const shopSchema = new mongoose.Schema({
    ownerId: {},
    brancheId: {},
    name: {},
    type: {},
    activeState:    { type: Boolean,  default: true },
    createdAt:      { type: Date,     default: new Date() },
    description:    { type: String,   default: ''},
}, {
    timestamps: true
  });

module.exports = mongoose.model('Shop', shopSchema);