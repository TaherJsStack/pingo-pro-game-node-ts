import express, { Router, Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import { DeviceController } from '../../controllers/api/device';
import signReqData from '../../middleware/sign-req-data';
import DeviceModel from '../../models/device';
import { AuthenticatedRequest } from '../../types/auth';

const router: Router = express.Router();
const deviceController: DeviceController = new DeviceController();

// Route: POST /items (Create item)
router.post(
  '',
  signReqData,
  [
    // Validation rules using express-validator
    check('name').notEmpty().withMessage('name is required'),
    check('price').notEmpty().withMessage('price is required'),
    check('type').notEmpty().withMessage('type is required'),
    check('mode').optional().isIn(['single', 'multi']),
    check('priceMulti')
      .if((value, { req }) => req.body.mode === 'multi')
      .notEmpty()
      .withMessage('priceMulti is required for multi mode'),
  ],
  async (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;
    const brancheId = (req as any).authData?.brancheId;
    const isDevice = await DeviceModel.findOne({
      name,
      brancheId,
      ...(req as any).authData?.tenantId ? { tenantId: (req as any).authData.tenantId } : {},
    });

    if (isDevice) {
      return res.status(400).json({ errors: [{ path: 'name', msg: 'name is already exists' }] });
    }

    // Call controller method to create item
    await deviceController.createItem(req as AuthenticatedRequest, res);
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
      .withMessage('address is required'),
    check('mode').optional().isIn(['single', 'multi']),
    check('priceMulti')
      .if((value, { req }) => req.body.mode === 'multi')
      .notEmpty()
      .withMessage('priceMulti is required for multi mode'),
  ],
  async (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Call controller method to update item
    await deviceController.updateItem(req, res);
  }
);

// Route: PUT /updateDeviceStopCategoresReletedToBillByIdsList/:id (Free booked devices for a closed bill)
router.put(
  '/updateDeviceStopCategoresReletedToBillByIdsList/:id',
  signReqData,
  async (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Call controller method to update item
    await deviceController.updateDeviceStopCategoresReletedToBillByIdsList(req, res);
  }
);

// Route: GET /items (Get all items)
router.get('', signReqData, deviceController.getAllItems);

// Route: GET /items/:id (Get item by ID)
router.get('/:id', signReqData, deviceController.getItemById);

// Route: DELETE /items/:id (Delete item)
router.delete('/:id', signReqData, deviceController.deleteItem);

export default router;
