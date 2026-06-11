import express, { Router, Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import {ClientController} from '../../controllers/api/client';
// import checkAuth from '../../middleware/check-auth';
import signReqData from '../../middleware/sign-req-data';
import { AuthenticatedRequest } from '../../types/auth';

const router: Router = express.Router();
const clientController:ClientController = new ClientController();

// Route: POST /items (Create item)
router.post(
  '',
  signReqData,
  [
    // Validation rules using express-validator
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
    await clientController.createItem(req as AuthenticatedRequest, res);
  }
);

// Route: PUT /items/:id (Update item)
router.put(
  '/:id',
  signReqData,
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
    await clientController.updateItem(req, res);
  }
);



// Other routes for GET (Read) and DELETE operations...
router.get('', signReqData, clientController.getAllItems);

router.get('/check-phone/:phone', signReqData, clientController.checkPhone);

router.delete('/:id', signReqData, clientController.deleteItem);

export default router;
