const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const Controller = require('../../controllers/api/invoice-menu');
// const checkAuth     = require('../../middleware/check-auth');
const signReqData   = require('../../middleware/sign-req-data');

// Route: POST /items (Create item)
router.post(
  '',
  signReqData,
  [
    // Validation rules using express-validator
    check('brancheId').notEmpty().withMessage('brancheId is required'),
    check('client').notEmpty().withMessage('price is required'),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Call controller method to create item
    await Controller.createItem(req, res);
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
    await Controller.updateItem(req, res);
  }
);

// Route: PUT /items/:id (Update item)
router.put(
  '/updateMenuItems/:id',
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
    await Controller.updateMenuItems(req, res);
  }
);

// Route: PUT /items/:id (Update item)
router.put(
  '/lockOrders/:id',
  signReqData,
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
    await Controller.updateMenuItemsLockOrders(req, res);
  }
);



// Route: PUT /items/:id (Update item)
// router.put(
//   '/updateCategoryStopAllCategoresReletedToBill/:id',
//   // [
//   //   // Validation rules using express-validator
//   //   check('branche').optional().notEmpty().withMessage('branche is required'),
//   //   check('address')
//   //     .optional()
//   //     .notEmpty()
//   //     .withMessage('address is required')
//   // ],
//   async (req, res) => {
//     // Check for validation errors
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     // Call controller method to update item
//     await Controller.updateCategoryStopAllCategoresReletedToBill(req, res);
//   }
// );

// Other routes for GET (Read) and DELETE operations...
router.get("",        Controller.getAllItems);

router.delete('/:id', Controller.deleteItem)


module.exports = router;
