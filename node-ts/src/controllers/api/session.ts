import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { SessionService } from '../../services/session.service';
import { ISession } from '../../types';
import { deviceRepository, clientRepository, invoiceRepository, sessionRepository } from '../../repositories/instances';

const { ObjectId } = require('mongoose').Types;

const sessionService = new SessionService();


interface CreateItemRequest extends Request {
  authData: {
    id: string;
    tenantId?: string;
  };
  body: ISession;
}

interface EndSessionRequest extends Request {
  authData: {
    id: string;
    tenantId?: string;
  };
  body: Partial<ISession> & {
    deviceId?: string;
    devicesIds?: string[];
    endTime?: string;
    description?: string;
    name?: string;
    phone?: string;
  };
}

export class SessionController {
  private getScope(req: Request) {
    return { tenantId: (req as any).authData?.tenantId, requireTenant: true };
  }

  createItem = async (req: CreateItemRequest, res: Response) => {
    try {
      const savedItem = await sessionService.createItem(
        {
          ...req.body,
          clientRequestId: (req as any).idempotency?.key ?? (req.body as any).clientRequestId,
        } as any,
        req.authData.id,
        req.authData.tenantId
      );
      const responseStatus = savedItem?.activeState ? 201 : 200;

      res.status(responseStatus).json({
        success: true,
        errors: [],
        status: responseStatus,
        message: '',
        data: [savedItem],
      });
    } catch (err: any) {
      console.error('SessionController createItem err.message -->', err.message);
      res.status(500).json({
        success: false,
        errors: [err.message],
        status: 500,
        message: '',
        data: [],
      });
    }
  };

  getAllItems = async (req: Request, res: Response) => {
    // let filter = JSON.parse(req.query.Filter);
    let filter = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : {};
    // console.log('sessions filter --->', filter);
    let { brancheId } = filter;

    const pageSize = req.query.PageSize && +req.query.PageSize > 0 ? req.query.PageSize : 15;
    const pageNo = req.query.PageNo && +req.query.PageNo > 0 ? req.query.PageNo : 1;

    try {
      // Fetch all items from database
      const items = await sessionRepository.find({ brancheId }, { sort: { createdAt: -1, activeState: 1 }, scope: this.getScope(req) });
      res.status(201).json({
        success: true,
        errors: [],
        status: 200,
        message: '',
        data: items,
      });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  };

  getAllItemsPagination = async (req: Request, res: Response) => {
    try {
      let { page = 1, limit = 10, filterBy, filterValue } = req.query;
      page = +page;
      limit = +limit;

      // Build filter object based on query parameters
      let filter = {};
      // if (filterBy && filterValue) {
      //   filter[filterBy] = { $regex: new RegExp(filterValue, 'i') }; // Case-insensitive regex search
      // }

      // Fetch items from database with pagination and filtering
      const items = await sessionRepository.find(filter, {
        skip: (page - 1) * limit,
        limit,
        scope: this.getScope(req),
      });

      // Count total number of items (for pagination)
      const totalCount = await sessionRepository.countDocuments(filter, this.getScope(req));

      res.status(200).json({
        success: true,
        data: {
          items,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            itemsPerPage: limit,
          },
        },
      });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  };

  getItemById = async (req: Request, res: Response) => {
    try {
      const item = await sessionRepository.findById(req.params.id, this.getScope(req));
      if (!item) {
        return res.status(404).json({ msg: 'Item not found' });
      }
      res.status(200).json({
        success: true,
        errors: [],
        status: 200,
        message: '',
        data: [item],
      });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  };

  updateItem = async (req: Request, res: Response) => {
    try {
      // Update item by ID in database
      const updatedItem = await sessionRepository.updateById(req.params.id, req.body as any, this.getScope(req));
      if (!updatedItem) {
        return res.status(404).json({ msg: 'Item not found' });
      }
      res.status(201).json({
        success: true,
        errors: [],
        status: 200,
        message: '',
        data: [updatedItem],
      });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  };

  endSession = async (req: EndSessionRequest, res: Response) => {
    try {
      const result = await sessionService.endSession(req.params.id, req.body, req.authData.id, req.authData.tenantId);

      res.status(200).json({
        success: true,
        errors: [],
        status: 200,
        message: result.message,
        data: [result.session],
        bill: result.bill,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        errors: [err.message],
        status: 500,
        message: '',
        data: [],
      });
    }
  };

  deleteItem = async (req: Request, res: Response) => {
    try {
      // Delete item by ID from database
      const deletedItem = await sessionRepository.deleteById(req.params.id, this.getScope(req));
      if (!deletedItem) {
        return res.status(404).json({ msg: 'Item not found' });
      }
      res.status(201).json({
        success: true,
        errors: [],
        status: 200,
        message: '',
        data: [deletedItem],
      });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  };

  deleteSessionItem = async (req: Request, res: Response) => {
    try {
      // Delete item by ID from database
      const deletedItem = await sessionRepository.deleteById(req.params.id, this.getScope(req));
      if (!deletedItem) {
        return res.status(404).json({ msg: 'Item not found' });
      }

      res.status(201).json({
        success: true,
        errors: [],
        status: 200,
        message: '',
        data: [deletedItem],
      });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  };

  deleteAllReletedToBill = async (req: Request, res: Response) => {
    try {
      // console.log('deleteAllReletedToBill req.params', req.params);

      let ids = req.params.id.split(',');
      let deletedList = await sessionRepository.deleteManyByIds(ids, this.getScope(req));

      res.status(201).json({
        success: true,
        errors: [],
        status: 200,
        message: ids,
        data: ids,
      });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  };
}

