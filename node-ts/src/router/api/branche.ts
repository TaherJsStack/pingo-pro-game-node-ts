import express, { Router, Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import { BrancheController } from '../../controllers/api/branche';
// import checkAuth from '../../middleware/check-auth';
import signReqData from '../../middleware/sign-req-data';
import upload from '../../middleware/multer-config';
import { AuthenticatedRequest } from '../../types/auth';

const router: Router = express.Router();
const brancheController: BrancheController = new BrancheController();

// Route: POST /items (Create item)
router.post(
  '',
  upload.single('logo'),
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
    console.log('req.body -->', req.body);

    // Call controller method to create item
    await brancheController.createItem(req as AuthenticatedRequest, res);
  }
);

// Route: PUT /items/:id (Update item)
router.put(
  '/:id',
  upload.single('logo'),
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
    await brancheController.updateItem(req, res);
  }
);

// Other routes for GET (Read) and DELETE operations...
router.get("", signReqData, brancheController.getAllItems);

router.get("/:id", signReqData, brancheController.getItemById);

export default router;
