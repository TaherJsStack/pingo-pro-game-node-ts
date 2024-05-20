const mongoose = require('mongoose');

const AuditSchema = new mongoose.Schema({
    action:       { type: String },
    method:       { type: String },
    baseUrl:      { type: String },
    platform:     { type: String },
    success:      { type: String },
    status:       { type: String },
    error:        { type: String },
    auditByName:  { type: String },
    auditById:    { type: String },
    auditOn:      { type: Date },
    role:         { type: Number },
    permeation:   { type: [Number] }

}, {
    timestamps: true
  });

module.exports = mongoose.model('Audit', AuditSchema);