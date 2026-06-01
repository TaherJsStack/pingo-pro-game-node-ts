import { Request, Response } from 'express';
import { IInvoiceMenu } from '../../types';
import { CRUDController } from '../base/CRUDController';
import { invoiceMenuRepository } from '../../repositories/instances';
const { ObjectId } = require('mongoose').Types;

interface CreateItemRequest extends Request {
  body: IInvoiceMenu;
  authData: {
    id: string;
  };
}

export class InvoiceMenuController extends CRUDController<IInvoiceMenu>{
  constructor() {
    super(invoiceMenuRepository);
  }
  // Create - POST request handler
  createItem = async (req: CreateItemRequest, res: Response): Promise<void> => {
    try {
      // Create new item using request body
      const savedItem = await this.repository.create({
        ...(req.body as any),
        createdBy: new ObjectId(req.authData.id),
      } as any);

      (savedItem as any).updateTotal?.()
        .then((total: any) => {
          // console.log('Updated total:', total);
        })
        .catch((error: any) => {
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
      const updatedItem = await this.repository.updateById(req.params.id, req.body as any);
      if (!updatedItem) {
        res.status(404).json({ msg: 'Item not found' });
        return;
      }
      if (updatedItem) {
        (updatedItem as any).updateTotal?.()
        .then((total: any) => {
          // console.log('Updated total:', total);
        })
        .catch((error: any) => {
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
      const updatedItem = await this.repository.updateById(req.params.id, req.body as any);
      if (!updatedItem) {
        res.status(404).json({ msg: 'Item not found' });
        return;
      }
      if (updatedItem) {      
        (updatedItem as any).updateTotal?.()
          .then((total: any) => {
            // console.log('Updated total:', total);
          })
          .catch((error: any) => {
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

