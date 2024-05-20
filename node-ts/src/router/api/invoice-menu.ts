import express, { Request, Response, Router } from 'express';
import { check, validationResult } from 'express-validator';
import * as Controller from '../../controllers/api/invoice-menu';
// import checkAuth from '../../middleware/check-auth';
import signReqData from '../../middleware/sign-req-data';
import { IInvoiceMenu } from '../../models/invoice-menu';

const router: Router = express.Router();

interface CreateItemRequest extends Request {
  body: IInvoiceMenu;
  authData: {
    id: string;
  };
}

// Route: POST /items (Create item)
router.post(
  '',
  signReqData,
  [
    // Validation rules using express-validator
    check('brancheId').notEmpty().withMessage('brancheId is required'),
    check('client').notEmpty().withMessage('price is required'),
  ],
  async (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Call controller method to create item
    await Controller.createItem(req as CreateItemRequest, res);
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
  async (req: Request, res: Response) => {
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
  async (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Call controller method to update item
    await Controller.updateMenuItemsLockOrders(req as CreateItemRequest, res);
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
//   async (req: Request, res: Response) => {
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

export default router;