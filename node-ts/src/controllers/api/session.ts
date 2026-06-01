import { Request, Response } from 'express';
import { Types } from 'mongoose';
import CategoryModel from '../../models/category';
import ClientModel from '../../models/client';
import InvoiceModel from '../../models/invoice';
import SessionClientModel from '../../models/session';
import InvoiceService from '../../services/invoice.service';
import { ISession } from '../../models/interfaces/session.interface';

const { ObjectId } = require('mongoose').Types;


interface CreateItemRequest extends Request {
  authData: {
    id: string;
  };
  body: ISession;
}

interface EndSessionRequest extends Request {
  authData: {
    id: string;
  };
  body: Partial<ISession> & {
    categoryId?: string;
    categoriesIds?: string[];
    endTime?: string;
    description?: string;
    name?: string;
    phone?: string;
  };
}

export class SessionController {

  private normalizeCategoryIds(body: EndSessionRequest['body']): string[] {
    const idsFromCategories = Array.isArray(body.categories)
      ? body.categories
          .map((category: any) => String(category?.categoryId ?? ''))
          .filter(Boolean)
      : [];

    const requestedIds = body.categoriesIds ?? (body.categoryId ? [body.categoryId] : idsFromCategories);

    return [...new Set(requestedIds.map((id) => String(id)).filter(Boolean))];
  }

  private toInvoiceDateString(value: unknown): string | undefined {
    if (!value) {
      return undefined;
    }

    const parsedDate = value instanceof Date ? value : new Date(value as string);

    if (Number.isNaN(parsedDate.getTime())) {
      return undefined;
    }

    return parsedDate.toISOString();
  }

  private async createBillFromSession(session: any, req: EndSessionRequest, closedBy: any) {
    const existingInvoice = await InvoiceModel.findOne({ sessionId: session._id });
    if (existingInvoice) {
      return existingInvoice;
    }

    const createdBy = new ObjectId(req.authData.id);
    const client = session.clientId ? await ClientModel.findById(session.clientId) : null;
    const invoicesCount = await InvoiceModel.countDocuments({ brancheId: session.brancheId });

    const newInvoice = new InvoiceModel({
      sessionId: session._id,
      createdBy,
      closedBy,
      brancheId: session.brancheId,
      clientId: session.clientId ?? null,
      name: req.body.name ?? client?.name ?? '',
      phone: req.body.phone ?? client?.phone ?? '',
      activeState: false,
      description: req.body.description ?? session.description ?? '',
      invoiceNo: 20250601 + invoicesCount + 1,
      categories: session.categories.map((category: any) => ({
        categoryId: category.categoryId,
        createdBy: category.createdBy ?? createdBy,
        closedBy: category.closedBy ?? closedBy,
        type: category.type ?? 'open',
        price: Number(category.price ?? 0),
        startTime: this.toInvoiceDateString(category.startTime) ?? new Date().toISOString(),
        endTime: this.toInvoiceDateString(category.endTime),
        estimationTime: category.estimationTime ?? '',
        estimationInHours: Number(category.estimationInHours ?? 0),
        estimationInMinutes: Number(category.estimationInMinutes ?? 0),
      })),
      menuItems: Array.isArray(session.menuItems)
        ? session.menuItems.map((item: any) => ({
            itemID: item.itemID,
            createdBy: item.createdBy ?? createdBy,
            itemName: item.itemName,
            quantity: Number(item.quantity ?? 0),
            price: Number(item.price ?? 0),
          }))
        : [],
    });

    const savedInvoice = await newInvoice.save();
    await savedInvoice.calculateCategoriesTotal();
    await savedInvoice.calculateMenuItemsTotal();

    return savedInvoice;
  }

  createItem = async (req: CreateItemRequest, res: Response) => {
    try {
      const createdBy = new ObjectId(req.authData.id);
      const incomingCategories = Array.isArray(req.body.categories) ? req.body.categories : [];
      const categories = incomingCategories.map((device: any) => ({
        ...device,
        createdBy,
        closedBy: device.closedBy ?? null,
        type: device.type ?? 'open',
        Sessiontype: device.Sessiontype ?? 'open',
        startTime: device.startTime ?? new Date(),
        price: Number(device.price ?? 0),
        estimationInHours: Number(device.estimationInHours ?? 0),
        estimationInMinutes: Number(device.estimationInMinutes ?? 0),
      }));

      console.log("req.body --->", req.body)
      console.log("req.authData --->", req.authData)

      const existingSession = await SessionClientModel.findOne({
        clientId: req.body.clientId,
        brancheId: req.body.brancheId,
        activeState: true,
      });

      let savedItem;

      if (existingSession) {
        existingSession.categories.push(...categories);
        savedItem = await existingSession.save();
      } else {
        const newItem = new SessionClientModel({
          ...req.body,
          createdBy,
          activeState: true,
          categories,
        });

        savedItem = await newItem.save();
      }

      const responseStatus = existingSession ? 200 : 201;

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
    let { ownerId, brancheId } = filter;

    const pageSize = req.query.PageSize && +req.query.PageSize > 0 ? req.query.PageSize : 15;
    const pageNo = req.query.PageNo && +req.query.PageNo > 0 ? req.query.PageNo : 1;

    try {
      // Fetch all items from database
      const items = await SessionClientModel.find({ brancheId }).sort({ createdAt: -1, activeState: 1 });
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
      const items = await SessionClientModel.find(filter).skip((page - 1) * limit).limit(limit);

      // Count total number of items (for pagination)
      const totalCount = await SessionClientModel.countDocuments(filter);

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
      // Fetch item by ID from database
      const item = await SessionClientModel.findById(req.params.id);
      if (!item) {
        return res.status(404).json({ msg: 'Item not found' });
      }
      res.status(201).json({
        success: true,
        errors: [],
        status: 200,
        message: '',
        data: {},
      });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  };

  updateItem = async (req: Request, res: Response) => {
    try {
      // Update item by ID in database
      const updatedItem = await SessionClientModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updatedItem) {
        return res.status(404).json({ msg: 'Item not found' });
      }
      InvoiceService.setData({
        message: 'Invoice Service setData from update Item',
        setDataTyep: 'update',
        updatedItem,
      });
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
      const session = await SessionClientModel.findById(req.params.id);
      if (!session) {
        return res.status(404).json({ msg: 'Session not found' });
      }

      const requestedCategoryIds = this.normalizeCategoryIds(req.body);
      if (!requestedCategoryIds.length) {
        return res.status(400).json({
          success: false,
          errors: ['At least one categoryId is required to end a session.'],
          status: 400,
          message: '',
          data: [],
        });
      }

      const parsedEndTime = req.body.endTime ? new Date(req.body.endTime) : new Date();
      if (Number.isNaN(parsedEndTime.getTime())) {
        return res.status(400).json({
          success: false,
          errors: ['Invalid endTime value.'],
          status: 400,
          message: '',
          data: [],
        });
      }

      const closedBy = new ObjectId(req.authData.id);
      const matchedCategoryIds = new Set<string>();

      for (const category of session.categories as any[]) {
        const categoryId = String(category.categoryId);
        if (!requestedCategoryIds.includes(categoryId)) {
          continue;
        }

        matchedCategoryIds.add(categoryId);

        if (!category.endTime) {
          category.endTime = parsedEndTime;
          category.closedBy = closedBy;
        }
      }

      if (!matchedCategoryIds.size) {
        return res.status(400).json({
          success: false,
          errors: ['No matching session categories were found for the provided categoriesIds list.'],
          status: 400,
          message: '',
          data: [],
        });
      }

      if (req.body.description?.trim()) {
        session.description = req.body.description.trim();
      }

      await Promise.all(
        [...matchedCategoryIds].map((categoryId) =>
          CategoryModel.updateOne(
            { _id: new Types.ObjectId(categoryId) },
            { $set: { bookState: false } }
          )
        )
      );

      const allCategoriesEnded = (session.categories as any[]).every((category) => !!category.endTime);
      if (allCategoriesEnded) {
        session.activeState = false;
      }

      const savedSession = await session.save();
      const createdBill = allCategoriesEnded ? await this.createBillFromSession(savedSession, req, closedBy) : null;

      res.status(200).json({
        success: true,
        errors: [],
        status: 200,
        message: createdBill ? 'Session ended and bill created successfully.' : 'Session categories ended successfully.',
        data: [savedSession],
        bill: createdBill,
      });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  };

  deleteItem = async (req: Request, res: Response) => {
    try {
      // Delete item by ID from database
      const deletedItem = await SessionClientModel.findByIdAndDelete(req.params.id);
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
      const deletedItem = await SessionClientModel.findByIdAndDelete(req.params.id);
      if (!deletedItem) {
        return res.status(404).json({ msg: 'Item not found' });
      }

      InvoiceService.setData({
        message: 'Invoice Service setData from delete Session Item',
        setDataTyep: 'end',
        deletedItem,
        endIn: req.params.endIn,
      });

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
      let idsToDelete = ids.map((id) => new Types.ObjectId(id));

      let deletedList = await SessionClientModel.deleteMany({ _id: { $in: idsToDelete } });

      // InvoiceService.setData({
      //   message: 'Invoice Service setData from delete All Releted To Bill',
      //   setDataTyep: 'endList',
      //   idsToDelete,
      //   endIn: req.params.endIn,
      // });

      // let invoiceSetEndTimeToSessionsList = new InvoiceController();
      // await invoiceSetEndTimeToSessionsList.setEndTimeToSessionsList({
      //   idsToDelete: idsToDelete as [],
      //   endIn: req.params.endIn,
      // });

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
