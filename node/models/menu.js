const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator')
require('mongoose-type-email');

const MenuSchema = new mongoose.Schema({
    ownerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
    brancheId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Branche', required: true },
    name:         { type: String,   required: true },
    price:        { type: Number,   required: true },
    type:         { type: String,   required: true },
    logo:         { type: String,   default: '' },
    description:  { type: String,   default: '' },
    activeState:  { type: Boolean,  default: true },
    createdAt:    { type: Date,     default: new Date() },
}, {
    timestamps: true
  });

  // Custom validation to check uniqueness of menu for ownerId and brancheId combination
  MenuSchema.pre('validate', async function(next) {
    const existingMenu = await mongoose.models.Menu.findOne({
      name:      this.name,
      brancheId: this.brancheId,
    });

    if (existingMenu) {
      const error = new Error('Menu must be unique for brancheId combination');
      this.invalidate('menu', error.message);
    }

    next();
  });

  MenuSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Menu', MenuSchema);