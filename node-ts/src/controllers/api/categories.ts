import { Request, Response } from 'express';
import { Types } from 'mongoose';
import CategoryModel, { ICategory } from '../../models/category';
const { ObjectId } = require('mongoose').Types;

interface CreateItemRequest extends Request {
  authData: {
    id: string;
  };
  body: ICategory;
}

export class CategoryController{
  // Create - POST request handler
  createItem = async (req: CreateItemRequest, res: Response): Promise<void> => {
    try {
      // Create new item using request body
      const newItem: ICategory = new CategoryModel(req.body);
  
      newItem.ownerId = new ObjectId(req.authData.id);
      // Save item to database
      const savedItem = await newItem.save();
      res.status(201)
          .json({
            success: true,
            errors: [],
            status: 200,
            message:  '',
            data: [savedItem]
        });
    } catch (err : any) {
      console.error('err.message -->',err.message);
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
  
  // Read - GET request handler (Get all items)
  getAllItems = async (req: Request, res: Response): Promise<void> => {
    // let filter = JSON.parse(req.query.Filter);
  
    let filter = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : {};
  
    let {ownerId, brancheId} = filter;
  
    const pageSize = req.query.PageSize && +req.query.PageSize > 0 ? req.query.PageSize : 15;
    const pageNo   = req.query.PageNo && +req.query.PageNo > 0 ? req.query.PageNo : 1 ;
    try {
      // Fetch all items from database
      const items = await CategoryModel.find({ brancheId}).sort({ type: -1, activeState: -1, createdAt: -1 });
      res.status(201)
      .json({
        success: true,
        errors: [],
        status: 200,
        message:  '',
        data: items
    });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  };
  
  // Read - GET request handler (Get all items with pagination and filtering)
  getAllItemsPagination = async (req: Request, res: Response): Promise<void> => {
    try {
      let { page = 1, limit = 10, filterBy, filterValue } = req.query;
  
      // Build filter object based on query parameters
      let filter = {};
      // if (filterBy && filterValue) {
      //   filter[filterBy] = { $regex: new RegExp(filterValue, 'i') }; // Case-insensitive regex search
      // }
  
      // Fetch items from database with pagination and filtering
      const items = await CategoryModel.find(filter)
        .skip((+page - 1) * +limit)
        .limit(+limit);
  
      // Count total number of items (for pagination)
      const totalCount = await CategoryModel.countDocuments(filter);
  
      res.status(200).json({
        success: true,
        data: {
          items,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / +limit),
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
  
  // Read - GET request handler (Get item by ID)
  getItemById = async (req: Request, res: Response): Promise<void> => {
    try {
      // Fetch item by ID from database
      const item = await CategoryModel.findById(req.params.id);
      if (!item) {
        res.status(404).json({ msg: 'Item not found' });
      }
      res.status(201)
          .json({
            success: true,
            errors: [],
            status: 200,
            message:  '',
            data: {}
        });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  };
  
  // Update - PUT request handler
  updateCategoryStopAllCategoresReletedToBill = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check if IDs are provided in the request body
      const ids: string[] = await req.body;
  
      if (!Array.isArray(ids) || ids.length === 0) {
         res.status(400).json({ msg: 'Invalid or empty IDs array' });
      }
  
      // Convert IDs to ObjectId
      let objectIds = await ids.map(id => new Types.ObjectId(id));
  
      // Update multiple categories by IDs in the database
      const updatedItems = await CategoryModel.updateMany(
        { _id: { $in: objectIds } },
        { $set: { bookState: false } }
      );
  
  
      if (!updatedItems) {
         res.status(404).json('No categories updated' );
      }
  
      res.status(200).json({
        success: true,
        errors: [],
        status: 200,
        message: 'Categories updated successfully',
        data: ids 
      });
    } catch (err: any) {
      console.error(err.message);
      res.status(500)
      .json({
        success: false,
        errors: [],
        status: 200,
        message: 'ERROR:: Stop All Categores Releted To Bill',
        data: err
      });
    }
  };
  
  // Update - PUT request handler
  updateItem = async (req: Request, res: Response): Promise<void> => {
    try {
      // Update item by ID in database
      const updatedItem = await CategoryModel.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!updatedItem) {
        res.status(404).json({ msg: 'Item not found' });
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
  
  // Delete - DELETE request handler
  deleteItem = async (req: Request, res: Response): Promise<void> => {
    try {
      // Delete item by ID from database
      const deletedItem = await CategoryModel.findByIdAndDelete(req.params.id);
      if (!deletedItem) {
        res.status(404).json({ msg: 'Item not found' });
      }
      res.status(201)
      .json({
        success: true,
        errors: [],
        status: 200,
        message:  '',
        data: [deletedItem]
    });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  };
}