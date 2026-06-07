import express, { Router, Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import {ComplaintsSuggestionController} from '../../controllers/api/complaints-suggestion';
// import checkAuth from '../../middleware/check-auth';
import signReqData from '../../middleware/sign-req-data';
import { IComplaintsSuggestion } from '../../models/interfaces/complaints-suggestion.interface';

const router: Router = express.Router();
const controller:ComplaintsSuggestionController = new ComplaintsSuggestionController();

interface CreateItemRequest extends Request {
  authData: {
    id: string;
  };
  body: IComplaintsSuggestion;
}
// Route: POST /items (Create item)
router.post(
  '',
  signReqData,
  [
    // Validation rules using express-validator
    check('brancheId').notEmpty().withMessage('branchId is required'),
    check('comment').notEmpty().withMessage('comment is required'),

  ],
  async (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Call controller method to create item
    await controller.createItem(req as CreateItemRequest, res);
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
