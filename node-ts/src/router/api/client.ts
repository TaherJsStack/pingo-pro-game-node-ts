import express, { Router, Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import * as ClientController from '../../controllers/api/client';
// import checkAuth from '../../middleware/check-auth';
import signReqData from '../../middleware/sign-req-data';
import { IClient } from '../../models/client';

const router: Router = express.Router();

interface CreateItemRequest extends Request {
  body: IClient;
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
    check('name').notEmpty().withMessage('name is required'),
    check('phone').notEmpty().withMessage('price is required'),
  ],
  async (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Call controller method to create item
    await ClientController.createItem(req as CreateItemRequest, res);
  }
);

// Route: PUT /items/:id (Update item)
router.put(
  '/:id',
  [
    // Validation rules using express-validator
    check('branche').optional().notEmpty().withMessage('branche is required'),
    check('address').optional().notEmpty().withMessage('address is required'),
  ],
  async (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Call controller method to update item
    await ClientController.updateItem(req, res);
  }
);

// Other routes for GET (Read) and DELETE operations...
router.get('', ClientController.getAllItems);

router.delete('/:id', ClientController.deleteItem);

export default router;