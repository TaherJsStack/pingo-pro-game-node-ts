import express, { Router, Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
// import { RequestHandler } from 'express-validator/src/base';
import * as CategoriesController from '../../controllers/api/categories';
// import checkAuth from '../../middleware/check-auth';
import signReqData from '../../middleware/sign-req-data';
import { ICategory } from '../../models/category';

const router: Router = express.Router();

interface CreateItemRequest extends Request {
  authData: {
    id: string;
  };
  body: ICategory;
}

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
  async (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Call controller method to create item
    await CategoriesController.createItem(req as CreateItemRequest, res);
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
  async (req: Request, res: Response) => {
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
  async (req: Request, res: Response) => {
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
router.get("", CategoriesController.getAllItems);

router.delete('/:id', CategoriesController.deleteItem);

export default router;