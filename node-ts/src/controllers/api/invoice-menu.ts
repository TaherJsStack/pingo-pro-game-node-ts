import { Request, Response } from 'express';
import { IInvoiceMenu } from '../../types';
import { CRUDController } from '../base/CRUDController';
import { invoiceMenuRepository, menuRepository } from '../../repositories/instances';
import { NotFoundError, ValidationError } from '../../errors/AppError';
const { ObjectId } = require('mongoose').Types;

interface CreateItemRequest extends Request {
  body: IInvoiceMenu;
  authData: {
    id: string;
  };
}

export class InvoiceMenuController extends CRUDController<IInvoiceMenu> {
  constructor() {
    super(invoiceMenuRepository);
  }

  private normalizeQuantity(quantityValue: unknown): number {
    const quantity = Number(quantityValue);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new ValidationError('quantity must be a positive integer.');
    }

    return quantity;
  }

  private async resolveMenuItem(req: Request, menuIdValue: unknown) {
    const menuId = String(menuIdValue ?? '').trim();
    if (!menuId || !ObjectId.isValid(menuId)) {
      throw new ValidationError('itemId must be a valid ObjectId.');
    }

    const menuItem = await menuRepository.findById(menuId, this.getScope(req));
    if (!menuItem) {
      throw new NotFoundError('Menu item not found.');
    }

    return menuItem;
  }

  private async resolveMenuItems(req: Request, rawMenuItems: unknown[]) {
    if (!Array.isArray(rawMenuItems) || rawMenuItems.length === 0) {
      throw new ValidationError('menuItems must be a non-empty array.');
    }

    return Promise.all(
      rawMenuItems.map(async (menuItem: any) => {
        const masterItem = await this.resolveMenuItem(req, menuItem.itemId ?? menuItem.itemID);
        return {
          itemId: masterItem._id,
          itemName: masterItem.name,
          quantity: this.normalizeQuantity(menuItem.quantity),
          price: Number(masterItem.price ?? 0),
        };
      })
    );
  }

  createItem = async (req: CreateItemRequest, res: Response): Promise<void> => {
    try {
      const menuItems = await this.resolveMenuItems(req, (req.body as any).menuItems);
      const savedItem = await this.repository.create({
        brancheId: req.body.brancheId,
        client: req.body.client,
        description: req.body.description ?? '',
        menuItems,
        createdBy: new ObjectId(req.authData.id),
      } as any, this.getScope(req));

      await (savedItem as any).updateTotal?.();
      res.status(201)
        .json({
          success: true,
          errors: [],
          status: 200,
          message: '',
          data: [savedItem]
        });
    } catch (err) {
      this.sendErrorResponse(req, res, err);
    }
  };

  updateMenuItemsLockOrders = async (req: CreateItemRequest, res: Response): Promise<void> => {
    try {
      req.body.closedBy = new ObjectId(req.authData.id);
      req.body.activeState = false;

      // Update item by ID in database
      const updatedItem = await this.repository.updateById(req.params.id, req.body as any, this.getScope(req));
      if (!updatedItem) {
        res.status(404).json({ msg: 'Item not found' });
        return;
      }
      if (updatedItem) {
        await (updatedItem as any).updateTotal?.();
      }
      res.status(201)
        .json({
          success: true,
          errors: [],
          status: 200,
          message: '',
          data: [updatedItem]
        });
    } catch (err) {
      this.sendErrorResponse(req, res, err);
    }
  };

  updateMenuItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const menuItems = await this.resolveMenuItems(req, (req.body as any).menuItems);
      const updatePayload = {
        client: (req.body as any).client,
        description: (req.body as any).description ?? '',
        menuItems,
      };
      const updatedItem = await this.repository.updateById(req.params.id, updatePayload as any, this.getScope(req));
      if (!updatedItem) {
        res.status(404).json({ msg: 'Item not found' });
        return;
      }
      if (updatedItem) {
        await (updatedItem as any).updateTotal?.();
      }

      res.status(201)
        .json({
          success: true,
          errors: [],
          status: 200,
          message: '',
          data: [updatedItem]
        });
    } catch (err) {
      this.sendErrorResponse(req, res, err);
    }
  };
}

