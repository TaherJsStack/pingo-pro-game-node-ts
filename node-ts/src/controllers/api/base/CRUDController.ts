import { Request, Response } from 'express';
import { Document, Model } from 'mongoose';

export abstract class CRUDController<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  public createItem = async (req: Request, res: Response) => {
    try {
      const newItem: T = new this.model(req.body);
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

  public getAllItems = async (req: Request, res: Response) => {
    try {
      const items = await this.model.find();
      res.status(200).json({
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

  public getItemById = async (req: Request, res: Response) => {
    try {
      const item = await this.model.findById(req.params.id);
      if (!item) {
        return res.status(404).json({ msg: 'Item not found' });
      }
      res.status(200).json({
        success: true,
        errors: [],
        status: 200,
        message: '',
        data: item,
      });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  };

  public updateItem = async (req: Request, res: Response) => {
    try {
      const updatedItem = await this.model.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updatedItem) {
        return res.status(404).json({ msg: 'Item not found' });
      }
      res.status(200).json({
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

  public deleteItem = async (req: Request, res: Response) => {
    try {
      const deletedItem = await this.model.findByIdAndDelete(req.params.id);
      if (!deletedItem) {
        return res.status(404).json({ msg: 'Item not found' });
      }
      res.status(200).json({
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
}