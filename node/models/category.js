const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator')
require('mongoose-type-email');

const CategorySchema = new mongoose.Schema({
    ownerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
    brancheId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Branche', required: true },
    category:     { type: String,   required: true },
    priceId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Pricing', required: true },
    price:        { type: Number,   default: 0 },
    type:         { type: String,   required: true },
    logo:         { type: String,   default: '' },
    description:  { type: String,   default: '' },
    activeState:  { type: Boolean,  default: true },
    bookState:    { type: Boolean,  default: false },
    createdAt:    { type: Date,     default: new Date() },
}, {
    timestamps: true
  });

  // Custom validation to check uniqueness of category for ownerId and brancheId combination
  CategorySchema.pre('validate', async function(next) {
    const existingCategory = await mongoose.models.Category.findOne({
      category: this.category,
      brancheId: this.brancheId,
    });

    if (existingCategory) {
      const error = new Error('Category must be unique for brancheId combination');
      this.invalidate('category', error.message);
    }

    next();
  });

  CategorySchema.plugin(uniqueValidator);

module.exports = mongoose.model('Category', CategorySchema);