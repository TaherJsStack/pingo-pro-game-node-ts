import { Request, Response } from 'express';
import { Document } from 'mongoose';
import MenuModel, { IMenu } from '../../models/menu';
const { ObjectId } = require('mongoose').Types;

interface CreateItemRequest extends Request {
  body: IMenu;
  authData: {
    id: string;
  };
}

export const createItem = async (req: CreateItemRequest, res: Response) => {
  try {
    const newItem = new MenuModel(req.body);

    newItem.ownerId = new ObjectId(req.authData.id);

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

export const getAllItems = async (req: Request, res: Response) => {
  let filter = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : {};

  let { ownerId, brancheId } = filter;

  const pageSize = req.query.PageSize && +req.query.PageSize > 0 ? req.query.PageSize : 15;
  const pageNo = req.query.PageNo && +req.query.PageNo > 0 ? req.query.PageNo : 1;
  try {
    const items = await MenuModel.find({ brancheId }).sort({ type: -1, activeState: -1, createdAt: -1 });
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

export const getAllItemsPagination = async (req: Request, res: Response) => {
  try {
    let { page = 1, limit = 10, filterBy, filterValue } = req.query;
    page = +page;
    limit = +limit;

    let filter: { [key: string]: { $regex: RegExp } } = {};
    // if (filterBy && filterValue) {
    //   filter[filterBy] = { $regex: new RegExp(filterValue, 'i') };
    // }

    const items = await MenuModel.find(filter)
      .skip((page - 1) * limit)
      .limit(limit);

    const totalCount = await MenuModel.countDocuments(filter);

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

export const getItemById = async (req: Request, res: Response) => {
  try {
    const item = await MenuModel.findById(req.params.id);
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

export const updateItem = async (req: Request, res: Response) => {
  try {
    const updatedItem = await MenuModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
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

export const deleteItem = async (req: Request, res: Response) => {
  try {
    const deletedItem = await MenuModel.findByIdAndDelete(req.params.id);
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