import express, { Request, Response, Router } from 'express';
import { check, validationResult } from 'express-validator';
import {InvoiceController} from '../../controllers/api/invoice';
// import checkAuth from '../../middleware/check-auth';
import signReqData from '../../middleware/sign-req-data';
import { IInvoice } from '../../models/interfaces/invoice.interface';

const router: Router = express.Router();
const invoiceController:InvoiceController = new InvoiceController();

interface CreateRequest extends Request {
  authData: {
    id: string;
  };
  body: IInvoice;
}

// Route: PUT /items/:id (Update item)
router.put(
  '/lockBill/:id',
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
    await invoiceController.updateLockBill(req as CreateRequest, res);
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
    await invoiceController.updateItemMenuItems(req, res);
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
    await invoiceController.updateItem(req, res);
  }
);

// Other routes for GET (Read) and DELETE operations...
router.get("",  invoiceController.getAllItems);

export default router;