import express, { Router, Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import {CategoryController} from '../../controllers/api/categories';
import signReqData from '../../middleware/sign-req-data';
import { ICategory } from '../../models/interfaces/category.interface';
// import { ICategory } from '../../models/category';

const router: Router = express.Router();
const categoryController:CategoryController = new CategoryController();

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
    await categoryController.createItem(req as CreateItemRequest, res);
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
    await categoryController.updateItem(req, res);
  }
);

// Route: PUT /updateCategoryStopAllCategoresReletedToBill/:id (Stop all related categories)
router.put(
  '/updateCategoryStopAllCategoresReletedToBill/:id',
  async (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Call controller method to update item
    await categoryController.updateCategoryStopAllCategoresReletedToBill(req, res);
  }
);

// Route: GET /items (Get all items)
router.get('', categoryController.getAllItems);

// Route: GET /items/pagination (Get all items with pagination)
// router.get('/pagination', categoryController.getAllItemsPagination);

// Route: GET /items/:id (Get item by ID)
router.get('/:id', categoryController.getItemById);

// Route: DELETE /items/:id (Delete item)
router.delete('/:id', categoryController.deleteItem);

export default router;
