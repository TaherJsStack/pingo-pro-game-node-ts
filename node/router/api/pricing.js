const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const PricingController = require('../../controllers/api/pricing');
// const checkAuth     = require('../../middleware/check-auth');
const signReqData   = require('../../middleware/sign-req-data');

// Route: POST /items (Create item)
router.post(
  '',
  signReqData,
  [
    // Validation rules using express-validator
    check('brancheId').notEmpty().withMessage('brancheId is required'),
    check('title').notEmpty().withMessage('category is required'),
    check('price').notEmpty().withMessage('price is required'),
    check('type').notEmpty().withMessage('type is required'),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Call controller method to create item
    await PricingController.createItem(req, res);
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
    await PricingController.updateItem(req, res);
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
    await PricingController.updateCategoryStopAllCategoresReletedToBill(req, res);
  }
);

// Other routes for GET (Read) and DELETE operations...
router.get("",        PricingController.getAllItems);

router.delete('/:id', PricingController.deleteItem)


module.exports = router;
