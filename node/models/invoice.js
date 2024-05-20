const mongoose = require('mongoose');
require('mongoose-type-email');

const invoiceSchema = new mongoose.Schema({
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'Auth',     required: true },
  closedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'Auth',     },
  brancheId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Branche',  required: true },
  categoryId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  clientId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Client',   required: true },
  sessionId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Session',  required: true },
  activeState: { type: Boolean,   default: true },
  createdAt:   { type: Date,      default: new Date() },
  description: { type: String,    default: ''},
  total:       { type: Number,    default: 0 },
  categoriesTotal: { type: Number,    default: 0 },
  menuItemsTotal:  { type: Number,    default: 0 },
  categories:  [
    {
      category:  { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
      sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session',  required: true },
      type:      { type: String, default: 'open', required: true }, // open or match
      price:     { type: Number, required: true },
      startIn:   { type: String, required: true },
      endIn:     { type: String  },
  }],
  menuItems:[
    {
      itemID:   { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', required: true },
      itemName: { type: String, required: true },
      quantity: { type: Number, required: true },
      price:    { type: Number, default: 1 }
  }],

}, {
  timestamps: true
});


// Define a method to calculate and update the total
invoiceSchema.methods.calculateCategoriesTotal = async function () {
  try {
    let total = 0;

    this.categories.forEach((category) => {
      if (category.startIn && category.endIn) {
        // Parse the startIn and endIn strings into Date objects
        const startTime = new Date(category.startIn);
        const endTime = new Date(category.endIn);
        // Calculate duration in hours
        const durationMs = endTime.getTime() - startTime.getTime();
        const durationHours = durationMs / (1000 * 60 * 60); // Convert milliseconds to hours
        // Calculate quantity based on duration and price per hour
        const categoryTotal = durationHours * category.price;
        // Add categoryTotal to overall total
        total += categoryTotal;
      }
    });

    // Update the total field in the document
    this.categoriesTotal = total;
    await this.save();
    return this.categoriesTotal;
  } catch (error) {
    throw error;
  }
};

invoiceSchema.methods.calculateMenuItemsTotal = async function() {
  try {
    const total = this.menuItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
    this.menuItemsTotal = total;
    await this.save();
    return this.menuItemsTotal;
  } catch (error) {
    console.log('calculateMenuItemsTotal ----> ', error);
    throw error;
  }
};


// Pre-save middleware to perform operations before saving or updating
invoiceSchema.pre('save', async function(next) {
  try {
    // Check if the document is new or being updated
    if (this.isNew) {
      // Operations to perform before saving a new document
      // console.log('Preparing to save a new invoice...');
      // console.log('this.isNew ---> ', this.isNew);
      // Additional operations...

      // await this.calculateMenuItemsTotal();
      // await this.calculateCategoriesTotal();
      this.total = this.menuItemsTotal + this.categoriesTotal;

    } else {
      // Operations to perform before updating an existing document
      // console.log('Preparing to update an existing invoice...');
      // console.log('this.isNew else ---> ', this.isNew);

      // Additional operations...
      this.total = this.menuItemsTotal + this.categoriesTotal;
      // await this.save();

      // console.log('this.total ---> ', this.total);

    }
    
    // Call next to continue with the save or update operation
    next();
  } catch (error) {
    // Handle any errors that occur during the pre-save process
    console.error('Error in pre-save middleware:', error);
    next(error); // Pass the error to the next middleware or handler
  }
});


module.exports = mongoose.model('Invoice', invoiceSchema);



