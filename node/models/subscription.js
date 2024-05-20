const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator')
require('mongoose-type-email');

const subscriptionSchema = new mongoose.Schema({
    ownerId: {},
    state: {},
    type: {},
    activeState:    { type: Boolean,  default: true },
    createdAt:      { type: Date,     default: new Date() },
    description:    { type: String,   default: ''},
}, {
    timestamps: true
  });


subscriptionSchema.plugin(uniqueValidator)

module.exports = mongoose.model('Subscription', subscriptionSchema);