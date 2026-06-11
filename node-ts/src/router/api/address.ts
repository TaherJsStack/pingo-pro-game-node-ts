import express, { Router, Request, Response } from 'express';
import signReqData from '../../middleware/sign-req-data';
import { AddressController } from '../../controllers/api/address';
import { AuthenticatedRequest } from '../../types/auth';

const router: Router = express.Router();
const addressController: AddressController = new AddressController();

// Route: POST /items (Create item)
router.post( '', signReqData,
  async (req: Request, res: Response) => {
    await addressController.createItem(req as AuthenticatedRequest, res);
  }
);

// Route: PUT /items/:id (Update item)
router.put(
  '/member/:id',
  signReqData,
  async (req: Request, res: Response) => {
    
    await addressController.updateItem(req, res);
  }
);

router.get("", signReqData, addressController.getAllItems);

router.delete('/:id', signReqData, addressController.deleteItem)


export default router;
