import express, { Router, Request, Response } from 'express';
import signReqData from '../../middleware/sign-req-data';
import { IAddress } from '../../models/interfaces/address.interface';
import { AddressController } from '../../controllers/api/address';

const router: Router = express.Router();
const addressController: AddressController = new AddressController();

interface CreateItemRequest extends Request {
  body: IAddress;
  authData: {
    id: string;
  };
}

// Route: POST /items (Create item)
router.post( '', signReqData,
  async (req: Request, res: Response) => {
    await addressController.createItem(req as CreateItemRequest, res);
  }
);

// Route: PUT /items/:id (Update item)
router.put(
  '/:id',
  async (req: Request, res: Response) => {
    await addressController.updateItem(req, res);
  }
);

router.get("",        addressController.getAllItems);

router.delete('/:id', addressController.deleteItem)


export default router;