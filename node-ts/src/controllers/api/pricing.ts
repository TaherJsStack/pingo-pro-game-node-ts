import { Request, Response } from 'express';
import { Types } from 'mongoose';
import PricingModel from '../../models/pricing';
import { CRUDController } from './base/CRUDController';
import { IPricing } from '../../models/interfaces/pricing.interface';


export class PricingController extends CRUDController<IPricing> {
  constructor() {
    super(PricingModel);
  }
  
  // Update - PUT request handler
  updateCategoryStopAllCategoresReletedToBill = async (req: Request, res: Response): Promise<void> => {
    debugger;
    try {
      // Check if IDs are provided in the request body
      const ids: string[] = await req.body;
  
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ msg: 'Invalid or empty IDs array' });
      }
  
      // Convert IDs to ObjectId
      let objectIds = await ids.map((id) => new Types.ObjectId(id));
  
      // Update multiple categories by IDs in the database
      const updatedItems = await PricingModel.updateMany(
        { _id: { $in: objectIds } },
        { $set: { bookState: false } }
      );
  
      if (updatedItems) {
        res.status(404).json({ msg: 'No categories updated' });
      }
  
      res.status(200).json({
        success: true,
        errors: [],
        status: 200,
        message: 'Categories updated successfully',
        data: ids,
      });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).json({
        success: false,
        errors: [],
        status: 200,
        message: 'ERROR:: Stop All Categores Releted To Bill',
        data: err,
      });
    }
  };
  
}