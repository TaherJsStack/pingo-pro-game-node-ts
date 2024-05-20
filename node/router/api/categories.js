const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const CategoriesController = require('../../controllers/api/categories');
// const checkAuth     = require('../../middleware/check-auth');
const signReqData   = require('../../middleware/sign-req-data');

// Route: POST /items (Create item)
router.post(
  '',
  signReqData,
  [
    // Validation rules using express-validator
    check('brancheId').notEmpty().withMessage('brancheId is required'),
    check('category').notEmpty().withMessage('category is required'),
    check('priceId').notEmpty().withMessage('price is required'),
    check('type').notEmpty().withMessage('type is required'),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Call controller method to create item
    await CategoriesController.createItem(req, res);
  }
);

// Route: PUT /items/:id (Update item)
router.put(
  '/:id',
  [
    // Validation rules using express-validator
    check('branche').optional().notEmpty().withMessage('branche is required'),
    check('address')
      .optional()
      .notEmpty()
      .withMessage('address is required')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Call controller method to update item
    await CategoriesController.updateItem(req, res);
  }
);

// Route: PUT /items/:id (Update item)
router.put(
  '/updateCategoryStopAllCategoresReletedToBill/:id',
  // [
  //   // Validation rules using express-validator
  //   check('branche').optional().notEmpty().withMessage('branche is required'),
  //   check('address')
  //     .optional()
  //     .notEmpty()
  //     .withMessage('address is required')
  // ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Call controller method to update item
    await CategoriesController.updateCategoryStopAllCategoresReletedToBill(req, res);
  }
);

// Other routes for GET (Read) and DELETE operations...
router.get("",        CategoriesController.getAllItems);

router.delete('/:id', CategoriesController.deleteItem)


module.exports = router;
