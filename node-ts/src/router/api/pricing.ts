import express, { Request, Response, Router } from 'express';
import { check, validationResult } from 'express-validator';
import {PricingController} from '../../controllers/api/pricing';
// import checkAuth from '../../middleware/check-auth';
import signReqData from '../../middleware/sign-req-data';
import { IPricing } from '../../models/interfaces/pricing.interface';
import Pricing from '../../models/pricing';

const router: Router = express.Router();
const pricingController: PricingController = new PricingController()

interface CreateItemRequest extends Request {
  body: IPricing;
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
    check('title').notEmpty().withMessage('category is required'),
    check('price').notEmpty().withMessage('price is required'),
    check('type').notEmpty().withMessage('type is required'),
  ],
  async (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title } = req.body;
    const isTitle = await Pricing.findOne({ title });

    if (isTitle) {
      return res.status(400).json({ errors: [{ path: 'title', msg: 'title is already exists' }] });
    }
    
    // Call controller method to create item
    await pricingController.createItem(req as CreateItemRequest, res);
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
    await pricingController.updateItem(req, res);
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
    await pricingController.updateCategoryStopAllCategoresReletedToBill(req, res);
  }
);

// Other routes for GET (Read) and DELETE operations...
router.get("",        pricingController.getAllItems);

router.delete('/:id', pricingController.deleteItem)

export default router;