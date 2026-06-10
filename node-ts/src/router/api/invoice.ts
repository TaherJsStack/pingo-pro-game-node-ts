import express, { Request, Response, Router } from 'express';
import { check, validationResult } from 'express-validator';
import {InvoiceController} from '../../controllers/api/invoice';
import signReqData from '../../middleware/sign-req-data';
import { idempotencyMiddleware } from '../../middleware/idempotency';
import { IInvoice } from '../../models/interfaces/invoice.interface';

const router: Router = express.Router();
const invoiceController:InvoiceController = new InvoiceController();

interface CreateRequest extends Request {
  authData: {
    id: string;
  };
  body: IInvoice;
}


router.post( '', signReqData,
  [
    check('brancheId').notEmpty().withMessage('brancheId is required'),
  ],
  idempotencyMiddleware,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    await invoiceController.createNewInvoice(req as CreateRequest, res);
  
})

// Route: PUT /items/:id (Update item)
router.put(
  '/updateBill/:id',
  signReqData,
  [
    check('clientId').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('clientId must be a valid Mongo id'),
  ],
  idempotencyMiddleware,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    await invoiceController.updateBill(req as CreateRequest, res);
  }
);

// Route: PUT /items/:id (Update item)
router.put(
  '/endCategoryBookStateInInvoice/:id',
  signReqData,
  [
    check('devices').isArray({ min: 1 }).withMessage('devices must be a non-empty array'),
    check('devices.*.deviceId').isMongoId().withMessage('each deviceId must be a valid Mongo id'),
    check('devices.*.endTime').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('endTime must be a valid ISO8601 date'),
  ],
  idempotencyMiddleware,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    await invoiceController.endDeviceBookStateInInvoice(req as CreateRequest, res);
  }
);

// Route: PUT /items/:id (Update item)
router.put(
  '/lockBill/:id',
  signReqData,
  [
    check('endTime').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('endTime must be a valid ISO8601 date'),
  ],
  idempotencyMiddleware,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    await invoiceController.updateLockBill(req as CreateRequest, res);
  }
);

// Route: PUT /items/:id (Update item)
router.put(
  '/updateMenuItems/:id',
  signReqData,
  [
    check('itemID').isMongoId().withMessage('itemID must be a valid Mongo id'),
    check('quantity').isInt({ min: 1 }).withMessage('quantity must be a positive integer'),
    check('price').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('price must be a non-negative number'),
  ],
  idempotencyMiddleware,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    await invoiceController.updateItemMenuItems(req, res);
  }
);

// Route: PUT /items/:id (Update item)
router.put(
  '/:id',
  signReqData,
  [
    check('address')
      .optional()
      .notEmpty()
      .withMessage('address is required')
  ],
  idempotencyMiddleware,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    await invoiceController.updateItem(req, res);
  }
);


// Other routes for GET (Read) and DELETE operations...
router.get("", signReqData, invoiceController.getAllItems);

router.get(
  '/getInvoicesByEmployeeWithCountsasync/:id',
  signReqData,
  invoiceController.getInvoicesByEmployeeWithCountsasync);

export default router;
