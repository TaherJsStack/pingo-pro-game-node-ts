import express, { Request, Response, Router } from 'express';
import { check, validationResult } from 'express-validator';
import  {InvoiceMenuController} from '../../controllers/api/invoice-menu';
import signReqData from '../../middleware/sign-req-data';
import { idempotencyMiddleware } from '../../middleware/idempotency';
import { IInvoiceMenu } from '../../models/interfaces/invoice-menu.interface';

const router: Router = express.Router();
const invoiceMenuController:InvoiceMenuController = new InvoiceMenuController();

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
    check('brancheId').notEmpty().withMessage('brancheId is required'),
    check('client').notEmpty().withMessage('client is required'),
    check('menuItems').isArray({ min: 1 }).withMessage('menuItems must be a non-empty array'),
    check('menuItems.*.quantity').isInt({ min: 1 }).withMessage('each quantity must be a positive integer'),
    check('menuItems.*.price').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('each price must be a non-negative number'),
  ],
  idempotencyMiddleware,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    await invoiceMenuController.createItem(req as CreateItemRequest, res);
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

    await invoiceMenuController.updateItem(req, res);
  }
);

// Route: PUT /items/:id (Update item)
router.put(
  '/updateMenuItems/:id',
  signReqData,
  [
    check('menuItems').isArray({ min: 1 }).withMessage('menuItems must be a non-empty array'),
    check('menuItems.*.quantity').isInt({ min: 1 }).withMessage('each quantity must be a positive integer'),
    check('menuItems.*.price').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('each price must be a non-negative number'),
  ],
  idempotencyMiddleware,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    await invoiceMenuController.updateMenuItems(req, res);
  }
);

// Route: PUT /items/:id (Update item)
router.put(
  '/lockOrders/:id',
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

    await invoiceMenuController.updateMenuItemsLockOrders(req as CreateItemRequest, res);
  }
);

// Other routes for GET (Read) and DELETE operations...
router.get("", signReqData, invoiceMenuController.getAllItems);

router.delete('/:id', signReqData, invoiceMenuController.deleteItem)

export default router;
