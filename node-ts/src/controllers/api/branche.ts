import { Request, Response } from 'express';
import BrancheModel, { IBranche } from '../../models/branche';
const { ObjectId } = require('mongoose').Types;

interface CreateItemRequest extends Request {
  authData: {
    id: string;
  };
  body: IBranche;
}

// Create - POST request handler
export const createItem = async (req: CreateItemRequest, res: Response) => {
  try {
    // Create new item using request body
    let newItem = new BrancheModel(req.body);

    newItem.ownerId = new ObjectId(req.authData.id);
    // Save item to database
    const savedItem = await newItem.save();
    res.status(201).json({
      success: true,
      errors: [],
      status: 200,
      message: '',
      data: [savedItem],
    });
  } catch (err: any) {
    console.error('err.message -->', err.message);
    res.status(500).json({
      success: false,
      errors: [err.message],
      status: 500,
      message: '',
      data: {},
    });
  }
};

// Read - GET request handler (Get all items)
export const getAllItems = async (req: Request, res: Response) => {
  let filter = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : {};

  let { ownerId, brancheId } = filter;

  const pageSize = req.query.PageSize && +req.query.PageSize > 0 ? req.query.PageSize : 15;
  const pageNo = req.query.PageNo && +req.query.PageNo > 0 ? req.query.PageNo : 1;

  try {
    // Fetch all items from database
    const items = await BrancheModel.find({ ownerId }).sort({ createdAt: -1, activeState: 1 });
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

// Read - GET request handler (Get item by ID)
export const getItemById = async (req: Request, res: Response) => {
  try {
    // Fetch item by ID from database
    const item = await BrancheModel.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ msg: 'Item not found' });
    }
    res.status(201).json({
      success: true,
      errors: [],
      status: 200,
      message: '',
      data: [item],
    });
  } catch (err : any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Update - PUT request handler
export const updateItem = async (req: Request, res: Response) => {
  try {
    // Update item by ID in database
    const updatedItem = await BrancheModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedItem) {
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

// Delete - DELETE request handler
export const deleteItem = async (req: Request, res: Response) => {
  try {
    // Delete item by ID from database
    const deletedItem = await BrancheModel.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
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