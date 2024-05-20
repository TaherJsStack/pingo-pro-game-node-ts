const mongoose = require('mongoose');

const PasswordSchema = new mongoose.Schema({
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
    password:   { type: String,  required: true },
    createdAt:  { type: Date,    default: new Date() },
}, {
    timestamps: true
  });

module.exports = mongoose.model('Password', PasswordSchema);