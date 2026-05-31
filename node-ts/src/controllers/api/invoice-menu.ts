import { Request, Response } from 'express';
import InvoiceMenuModel from '../../models/invoice-menu';
import { IInvoiceMenu } from '../../models/interfaces/invoice-menu.interface';
import { CRUDController } from '../base/CRUDController';
const { ObjectId } = require('mongoose').Types;

interface CreateItemRequest extends Request {
  body: IInvoiceMenu;
  authData: {
    id: string;
  };
}

export class InvoiceMenuController extends CRUDController<IInvoiceMenu>{
  constructor() {
    super(InvoiceMenuModel);
  }
  // Create - POST request handler
  createItem = async (req: CreateItemRequest, res: Response): Promise<void> => {
    try {
      // Create new item using request body
      const newItem = new InvoiceMenuModel(req.body);
  
      newItem.createdBy = new ObjectId(req.authData.id);
      // Save item to database
      const savedItem = await newItem.save();
      savedItem.updateTotal()
        .then(total => {
          // console.log('Updated total:', total);
        })
        .catch(error => {
          // console.error('Error updating total:', error);
        });
      res.status(201)
          .json({
            success: true,
            errors: [],
            status: 200,
            message:  '',
            data: [savedItem]
        });
    } catch (err: any) {
      console.error('createItem err.message -->',err.message);
      res.status(500)
        .json({
          success: false,
          errors: [ err.message ],
          status: 500,
          message:  '',
          data: {}
        });
      // .send('Server Error');
    }
  };

  // Update - PUT request handler
  updateMenuItemsLockOrders = async (req: CreateItemRequest, res: Response): Promise<void> => {
    try {
      req.body.closedBy = new ObjectId(req.authData.id);
      req.body.activeState = false;
  
      // Update item by ID in database
      const updatedItem = await InvoiceMenuModel.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!updatedItem) {
        res.status(404).json({ msg: 'Item not found' });
      }
      if (updatedItem) {
        updatedItem.updateTotal()
        .then(total => {
          // console.log('Updated total:', total);
        })
        .catch(error => {
          console.error('Error updating total:', error);
        });
      }
      res.status(201)
      .json({
        success: true,
        errors: [],
        status: 200,
        message:  '',
        data: [updatedItem]
    });
    } catch (err : any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  };
  
  // Update - PUT request handler
  updateMenuItems = async (req: Request, res: Response): Promise<void> => {
    try {
      // Update item by ID in database
      const updatedItem = await InvoiceMenuModel.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!updatedItem) {
        res.status(404).json({ msg: 'Item not found' });
      }
      if (updatedItem) {      
        updatedItem.updateTotal()
          .then(total => {
            // console.log('Updated total:', total);
          })
          .catch(error => {
            console.error('Error updating total:', error);
          });
      }
  
      res.status(201)
      .json({
        success: true,
        errors: [],
        status: 200,
        message:  '',
        data: [updatedItem]
    });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  };

}
