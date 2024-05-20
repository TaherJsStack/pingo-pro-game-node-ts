const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator')
require('mongoose-type-email');

const ownerSchema = new mongoose.Schema({
    name:           { type: String,  },
    email:          { type: mongoose.SchemaTypes.Email, required: true, unique: true },
    role:           { type: Number,   required:  true, default: 3 },
    permeation:     { type: [Number], required: true, default: [3] },
    // permeation:     { type: Number,  required: true, default: 0 },
    imageUrl:       { type: String,   default: ''},
    activeState:    { type: Boolean,  default: true },
    createdAt:      { type: Date,     default: new Date() },
    description:    { type: String,   default: ''},
    governorate:    { type: String,   default: ''},
    city:           { type: String,   default: ''},
    area:           { type: String,   default: ''},
    mobile:         { type: String,   default: ''},
    floorNo:        { type: String,   default: ''},
    streetNo:       { type: String,   default: ''},
    buildingNo:     { type: String,   default: ''},
    apartmentNo:    { type: String,   default: ''},
    title:          { type: String,   default: ''},
    imgPath:        { type: String,   default: ''},
    showInWebSite:  { type: Boolean,  default: false},
}, {
    timestamps: true
  });


ownerSchema.plugin(uniqueValidator)

module.exports = mongoose.model('Owner', ownerSchema);