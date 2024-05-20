const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const YourController = require('../controllers/YourController');

// Route: POST /items (Create item)
router.post(
  '/items',
  [
    // Validation rules using express-validator
    check('name').notEmpty().withMessage('Name is required'),
    check('description').notEmpty().withMessage('Description is required'),
    check('price').isNumeric().withMessage('Price must be a number'),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Call controller method to create item
    await YourController.createItem(req, res);
  }
);

// Route: PUT /items/:id (Update item)
router.put(
  '/items/:id',
  [
    // Validation rules using express-validator
    check('name').optional().notEmpty().withMessage('Name is required'),
    check('description')
      .optional()
      .notEmpty()
      .withMessage('Description is required'),
    check('price')
      .optional()
      .isNumeric()
      .withMessage('Price must be a number'),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Call controller method to update item
    await YourController.updateItem(req, res);
  }
);

// Other routes for GET (Read) and DELETE operations...

module.exports = router;
