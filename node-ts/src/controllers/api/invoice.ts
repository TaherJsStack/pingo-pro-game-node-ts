import { Types } from 'mongoose';
import { Request, Response } from 'express';
import InvoiceService from '../../services/invoice.service';
import { IInvoice } from '../../types';
import { CRUDController } from '../base/CRUDController';
import { clientRepository, invoiceRepository, menuRepository } from '../../repositories/instances';
import { NotFoundError, ValidationError } from '../../errors/AppError';
import { resolveEndTime } from '../../util/session-time';
const { ObjectId } = require('mongoose').Types;

interface CreateRequest extends Request {
  authData: {
    id: string;
    tenantId?: string;
  };
  body: IInvoice;
}

export class InvoiceController extends CRUDController<IInvoice> {
  constructor() {
    super(invoiceRepository);
  }

  private pickInvoiceUpdatableFields(body: Partial<IInvoice> & Record<string, unknown>) {
    const updates: Record<string, unknown> = {};

    if (typeof body.name === 'string') {
      updates.name = body.name;
    }
    if (typeof body.phone === 'string') {
      updates.phone = body.phone;
    }
    if (typeof body.description === 'string') {
      updates.description = body.description;
    }
    if ('clientId' in body) {
      updates.clientId = body.clientId || null;
    }

    return updates;
  }

  private normalizeQuantity(quantityValue: unknown): number {
    const quantity = Number(quantityValue);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new ValidationError('quantity must be a positive integer.');
    }

    return quantity;
  }

  private async resolveMenuLine(
    req: Request,
    menuIdValue: unknown,
    quantityValue: unknown,
  ): Promise<{ itemID: any; itemName: string; quantity: number; price: number }> {
    const menuId = String(menuIdValue ?? '').trim();
    if (!menuId || !Types.ObjectId.isValid(menuId)) {
      throw new ValidationError('itemID must be a valid ObjectId.');
    }

    const menuItem = await menuRepository.findById(menuId, this.getScope(req));
    if (!menuItem) {
      throw new NotFoundError('Menu item not found.');
    }

    return {
      itemID: menuItem._id,
      itemName: menuItem.name,
      quantity: this.normalizeQuantity(quantityValue),
      price: Number(menuItem.price ?? 0),
    };
  }

  createNewInvoice = async (req: CreateRequest, res: Response) => {
    try {
      const savedInvoice = await InvoiceService.createNewInvoice(
        {
          ...req.body,
          clientRequestId: (req as any).idempotency?.key ?? (req.body as any).clientRequestId,
        } as any,
        req.authData.id,
        req.authData.tenantId
      );
      this.sendResponse(req, res, 200, [savedInvoice], savedInvoice.devices.length, 'Invoice created successfully');
    } catch (err) {
      this.sendErrorResponse(req, res, err);
    }
  }

  // Read - GET request handler (Get all items with pagination and filtering)
  getAllItemsPagination = async (req: Request, res: Response) => {
    try {
      let { page = 1, limit = 10, filterBy, filterValue } = req.query;

      // Build filter object based on query parameters
      let filter: any = {};

      // Fetch items from database with pagination and filtering
      const pageNo = Number(page) || 1;
      const pageSize = Number(limit) || 10;
      const items = await invoiceRepository.find(filter, {
        skip: (pageNo - 1) * pageSize,
        limit: pageSize,
        scope: this.getScope(req),
      });

      // Count total number of items (for pagination)
      const totalCount = await invoiceRepository.countDocuments(filter, this.getScope(req));

      res.status(200).json({
        success: true,
        data: {
          items,
          pagination: {
            currentPage: pageNo,
            totalPages: Math.ceil(totalCount / pageSize),
            totalItems: totalCount,
            itemsPerPage: pageSize,
          },
        },
      });
    } catch (err) {
      this.sendErrorResponse(req, res, err);
    }
  };

  updateBill = async (req: CreateRequest, res: Response) => {
    try {
      const updates = this.pickInvoiceUpdatableFields(req.body as any);
      const updatedItem = await invoiceRepository.updateById(req.params.id, updates as any, this.getScope(req));
      if (!updatedItem) {
        return res.status(404).json({ msg: 'Item not found' });
      }
      await InvoiceService.syncInvoiceTotals(updatedItem);

      res.status(201)
        .json({
          success: true,
          errors: [],
          status: 200,
          message: '',
          data: [updatedItem],
        });
    } catch (err) {
      this.sendErrorResponse(req, res, err);
    }
  }

  endDeviceBookStateInInvoice = async (req: CreateRequest, res: Response) => {
    try {
      const { devices, activeState } = req.body;

      if (!devices || !devices[0]?.deviceId) {
        return res.status(400).json({
          success: false,
          errors: ['Invalid request data.'],
          status: 400,
          message: 'Device ID is required.',
        });
      }

      const updatedItem = await invoiceRepository.findById(req.params.id, this.getScope(req));
      if (!updatedItem) {
        throw new NotFoundError('Item not found');
      }

      const deviceId = String(devices[0].deviceId);
      const targetDevice = updatedItem.devices.find((device: any) => String(device.deviceId) === deviceId);
      if (!targetDevice) {
        throw new NotFoundError('Device not found on invoice.');
      }

      const closedBy = req.authData.id;
      const resolvedActiveState = typeof activeState === 'boolean' ? activeState : updatedItem.activeState;
      targetDevice.endTime = resolveEndTime(devices[0].endTime, targetDevice.startTime);
      targetDevice.closedBy = new Types.ObjectId(closedBy);
      updatedItem.activeState = resolvedActiveState;
      updatedItem.closedBy = resolvedActiveState === false ? new Types.ObjectId(closedBy) : null;

      await updatedItem.save();
      await InvoiceService.syncInvoiceTotals(updatedItem);

      res.status(200).json({
        success: true,
        errors: [],
        status: 200,
        message: 'Update successful.',
        data: [updatedItem],
      });
    } catch (err) {
      this.sendErrorResponse(req, res, err);
    }
  };

  updateLockBill = async (req: CreateRequest, res: Response) => {
    try {
      const updatedItem = await invoiceRepository.findById(req.params.id, this.getScope(req));
      if (!updatedItem) {
        throw new NotFoundError('Item not found');
      }

      const closedBy = new Types.ObjectId(req.authData.id);
      updatedItem.devices.forEach((device: any) => {
        if (device.endTime) {
          return;
        }

        device.endTime = resolveEndTime((req.body as any).endTime, device.startTime);
        device.closedBy = closedBy;
      });

      updatedItem.activeState = Boolean(req.body['activeState']);
      updatedItem.closedBy = closedBy;
      await updatedItem.save();
      await InvoiceService.syncInvoiceTotals(updatedItem);

      return res.status(201)
        .json({
          success: true,
          errors: [],
          status: 200,
          message: '',
          data: [updatedItem],
        })
    } catch (err) {
      this.sendErrorResponse(req, res, err);
    }
  };

  updateItemMenuItems = async (req: Request, res: Response) => {
    try {
      const updatedItem = await invoiceRepository.findById(req.params.id, this.getScope(req));
      if (!updatedItem) {
        throw new NotFoundError('Item not found');
      }

      const resolvedMenuLine = await this.resolveMenuLine(req, (req.body as any).itemID, (req.body as any).quantity);
      updatedItem.menuItems.push(resolvedMenuLine);
      await updatedItem.save();

      await InvoiceService.syncInvoiceTotals(updatedItem);
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
  }

  getInvoicesByEmployeeWithCountsasync = async (req: Request, res: Response) => {
    try {
      const empId = req.params.id;
      const {
        invoices,
        treeInvoices,
        totalInvoices,
        totalInvoicesClosedBy,
        totalInvoicesCreatedBy,
        sharedDevicesAdded,
        sharedDevicesClosed,
      } = await InvoiceService.getInvoicesByEmployeeWithCounts(empId, (req as any).authData?.tenantId);

      const clientAdded = await clientRepository.countDocuments({ createdBy: new ObjectId(empId) }, this.getScope(req));

      let percentages = {};
      // Ensure totalInvoices is not zero
      if (totalInvoices > 0) {
        percentages = {
          totalInvoicesClosedBy: (totalInvoicesClosedBy / totalInvoices) * 100,
          totalInvoicesCreatedBy: (totalInvoicesCreatedBy / totalInvoices) * 100,
          sharedDevicesAdded: (sharedDevicesAdded / totalInvoices) * 100,
          sharedDevicesClosed: (sharedDevicesClosed / totalInvoices) * 100,
        };
      }

      res.status(201)
        .json({
          success: true,
          errors: [],
          status: 200,
          message: '',
          data: {
            invoices,
            treeInvoices,
            totalInvoices,
            percentages,
            clientAdded
          },
        });
    } catch (err) {
      this.sendErrorResponse(req, res, err);
    }
  }
}

