import express, { Router, Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import {InboxController} from '../../controllers/api/inbox';
import signReqData from '../../middleware/sign-req-data';
import { AuthenticatedRequest } from '../../types/auth';

const router: Router = express.Router();
const controller:InboxController = new InboxController();
// Route: POST /items (Create item)
router.post(
  '',
  signReqData,
  [
    // Validation rules using express-validator
    // check('branche').notEmpty().withMessage('branche is required'),
    // check('address').notEmpty().withMessage('address is required'),
  ],
  async (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Call controller method to create item
    await controller.createItem(req as AuthenticatedRequest, res);
  }
);

// Route: PUT /items/:id (Update item)
router.put(
  '/:id',
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
    await controller.updateItem(req, res);
  }
);

// Other routes for GET (Read) and DELETE operations...
router.get("", signReqData, controller.getAllItems);

router.get("/getBranche/:id", signReqData, controller.getItemById);

export default router;
