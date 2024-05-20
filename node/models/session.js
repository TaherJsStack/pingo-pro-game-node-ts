const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'Auth',     required: true },
  brancheId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Branche',  },
  categoryId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  clientId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Client',   required: true },
  
  times:       { type: Number, default: 0 },

  startTime:   { type: String, required: true },
  // endTime:     { type: Date },

  activeState: { type: Boolean,  default: true },
  createdAt:   { type: Date,     default: new Date() },
  description: { type: String,   default: ''},

}, {
    timestamps: true
  });

  
  // // Custom validation to check uniqueness 
  // clientSchema.pre('validate', async function(next) {
  //   const existing = await mongoose.models.Client.findOne({
  //     phone: this.phone,
  //     brancheId: this.brancheId,
  //   });

  //   if (existing) {
  //     const error = new Error('Client must be unique for brancheId combination');
  //     this.invalidate('Client', error.message);
  //   }

  //   next();
  // });

module.exports = mongoose.model('Session', sessionSchema);