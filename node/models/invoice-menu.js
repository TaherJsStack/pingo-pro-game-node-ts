const mongoose = require('mongoose');
require('mongoose-type-email');

const invoiceMenuSchema = new mongoose.Schema({
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'Auth',     required: true },
  closedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'Auth',     },
  brancheId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Branche',  required: true },
  client:      { type: String,    required: true },
  total:       { type: Number,    default: 0 },
  activeState: { type: Boolean,   default: true },
  createdAt:   { type: Date,      default: new Date() },
  description: { type: String,    default: ''},
  menuItems:[
    {
      itemId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', required: true },
      itemName: { type: String, required: true },
      quantity:   { type: Number, required: true },
      price:    { type: Number, default: 1 }
  }],
}, {
  timestamps: true
});

// Define a method to calculate and update the total
invoiceMenuSchema.methods.updateTotal = async function() {
  try {
    const total = this.menuItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
    this.total = total;
    await this.save();
    return this.total;
  } catch (error) {
    throw error;
  }
};

// invoiceMenuSchema.pre('save', async function(next) {
//   try {
//     await this.updateTotal();
//     next();
//   } catch (error) {
//     next(error);
//   }
// });



module.exports = mongoose.model('invoiceMenu', invoiceMenuSchema);