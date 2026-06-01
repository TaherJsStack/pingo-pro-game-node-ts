import express, { Router, Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
// import checkAuth from '../../middleware/check-auth';
import signReqData from '../../middleware/sign-req-data';
import { SessionController } from '../../controllers/api/session';
import { ISession } from '../../models/interfaces/session.interface';

const router: Router = express.Router();

const sessionController: SessionController = new SessionController()

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
    check('categories').notEmpty().withMessage('categories is required'),
    check('clientId').notEmpty().withMessage('client Id is required'),
  ],
  async (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Call controller method to create item
    await sessionController.createItem(req as CreateItemRequest, res);
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
    await sessionController.updateItem(req, res);
  }
);

router.put(
  '/endSession/:id',
  signReqData,
  [
    // Validation rules using express-validator
    check('categoryId').optional().notEmpty().withMessage('categoryId is required'),
    check('categoriesIds').optional().isArray({ min: 1 }).withMessage('categoriesIds must be a non-empty array'),
  ],
  async (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Call controller method to update item
    await sessionController.endSession(req as CreateItemRequest, res);
  }
);

// Other routes for GET (Read) and DELETE operations...
router.get("",  sessionController.getAllItems);

router.delete('/:id', sessionController.deleteItem)
router.delete('/deleteSessionItem/:id/:endIn', sessionController.deleteSessionItem)
router.delete('/deleteAllReletedToBill/:id/:endIn', sessionController.deleteAllReletedToBill)

export default router;
