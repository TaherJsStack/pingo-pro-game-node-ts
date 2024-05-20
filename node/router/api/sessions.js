const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const SessionsController = require('../../controllers/api/session');
// const checkAuth     = require('../../middleware/check-auth');
const signReqData   = require('../../middleware/sign-req-data');

// Route: POST /items (Create item)
router.post(
  '',
  signReqData,
  [
    // Validation rules using express-validator
    check('brancheId').notEmpty().withMessage('brancheId is required'),
    check('categoryId').notEmpty().withMessage('category is required'),
    check('clientId').notEmpty().withMessage('price is required'),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Call controller method to create item
    await SessionsController.createItem(req, res);
  }
);

// Route: PUT /items/:id (Update item)
router.put(
  '/:id',
  [
    // Validation rules using express-validator
    check('brancheId').notEmpty().withMessage('brancheId is required'),
    check('categoryId').notEmpty().withMessage('categoryId is required'),
    check('clientId').notEmpty().withMessage('clientId is required'),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Call controller method to update item
    await SessionsController.updateItem(req, res);
  }
);

// Other routes for GET (Read) and DELETE operations...
router.get("",  SessionsController.getAllItems);

router.delete('/:id', SessionsController.deleteItem)
router.delete('/deleteSessionItem/:id/:endIn', SessionsController.deleteSessionItem)
router.delete('/deleteAllReletedToBill/:id/:endIn', SessionsController.deleteAllReletedToBill)



module.exports = router;
