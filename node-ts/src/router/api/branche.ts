import express, { Router, Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import * as BrancheController from '../../controllers/api/branche';
// import checkAuth from '../../middleware/check-auth';
import signReqData from '../../middleware/sign-req-data';
import { IBranche } from '../../models/branche';

const router: Router = express.Router();

interface CreateItemRequest extends Request {
  authData: {
    id: string;
  };
  body: IBranche;
}
// Route: POST /items (Create item)
router.post(
  '',
  signReqData,
  [
    // Validation rules using express-validator
    check('branche').notEmpty().withMessage('branche is required'),
    check('address').notEmpty().withMessage('address is required'),
  ],
  async (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Call controller method to create item
    await BrancheController.createItem(req as CreateItemRequest, res);
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
    await BrancheController.updateItem(req, res);
  }
);

// Other routes for GET (Read) and DELETE operations...
router.get("",  BrancheController.getAllItems);

router.get("/getBranche/:id",  BrancheController.getItemById);

export default router;