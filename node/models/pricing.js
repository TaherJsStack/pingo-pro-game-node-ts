const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator')
require('mongoose-type-email');

const pricingSchema = new mongoose.Schema({
    brancheId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Branche', required: true },
    title:        { type: String,  required: true },
    price:        { type: Number,  required: true },
    type:         { type: String,  required: true },
    activeState:  { type: Boolean, default: true },
    createdAt:    { type: Date,    default: new Date() },
    description:  { type: String,  default: ''},
}, {
    timestamps: true
  });

module.exports = mongoose.model('Pricing', pricingSchema);