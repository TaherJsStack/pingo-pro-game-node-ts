import { Request, Response } from 'express';
import { Types } from 'mongoose';
import SessionClientModel from '../../models/session';
import InvoiceService from '../../services/invoice.service';
import { ISession } from '../../models/interfaces/session.interface';
import { InvoiceController } from './invoice';

const { ObjectId } = require('mongoose').Types;


interface CreateItemRequest extends Request {
  authData: {
    id: string;
  };
  body: ISession;
}

export class SessionController{
  createItem = async (req: CreateItemRequest, res: Response) => {
    try {
      // Create new item using request body
      let newItem:ISession = new SessionClientModel(req.body);
  
      newItem.createdBy = new ObjectId(req.authData.id);
  
      // Save item to database
      const savedItem = await newItem.save();
      // InvoiceService.setData({
      //   message: 'Invoice Service setData from create Item',
      //   setDataTyep: 'create',
      //   savedItem,
      // });
  
      res.status(201).json({
        success: true,
        errors: [],
        status: 200,
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
        data: {},
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
