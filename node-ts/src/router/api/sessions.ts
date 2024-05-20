import express, { Router, Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import * as SessionsController from '../../controllers/api/session';
// import checkAuth from '../../middleware/check-auth';
import signReqData from '../../middleware/sign-req-data';
import { ISession } from '../../models/session';

const router: Router = express.Router();

interface CreateItemRequest extends Request {
  authData: {
    id: string;
  };
  body: ISession;
}

// Route: POST /items (Create item)
router.post(
  '',
  signReqData,
  [
    // Validation rules using express-validator
    check('brancheId').notEmpty().withMessage('brancheId is required'),
    check('categoryId').notEmpty().withMessage('category is required'),
    check('clientId').notEmpty().withMessage('price is required'),
  ],
  async (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Call controller method to create item
    await SessionsController.createItem(req as CreateItemRequest, res);
  }
);

// Route: PUT /items/:id (Update item)
router.put(
  '/:id',
  [
    // Validation rules using express-validator
    check('brancheId').notEmpty().withMessage('brancheId is required'),
    check('categoryId').notEmpty().withMessage('categoryId is required'),
    check('clientId').notEmpty().withMessage('clientId is required'),
  ],
  async (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Call controller method to update item
    await SessionsController.updateItem(req, res);
  }
);

// Other routes for GET (Read) and DELETE operations...
router.get("",  SessionsController.getAllItems);

router.delete('/:id', SessionsController.deleteItem)
router.delete('/deleteSessionItem/:id/:endIn', SessionsController.deleteSessionItem)
router.delete('/deleteAllReletedToBill/:id/:endIn', SessionsController.deleteAllReletedToBill)

export default router;