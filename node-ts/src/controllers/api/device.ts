import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { IDevice } from '../../types';
import { CRUDController } from '../base/CRUDController';
import { deviceRepository } from '../../repositories/instances';

export class DeviceController extends CRUDController<IDevice> {
  constructor() {
    super(deviceRepository);
  }

  // Free the bookState for every device tied to a closed bill.
  updateDeviceStopCategoresReletedToBillByIdsList = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check if IDs are provided in the request body
      const ids: string[] = await req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ msg: 'Invalid or empty IDs array' });
      }

      // Convert IDs to ObjectId
      let objectIds = await ids.map(id => new Types.ObjectId(id));

      // Update multiple devices by IDs in the database
      const updatedItems = await this.repository.updateMany(
        { _id: { $in: objectIds } },
        { $set: { bookState: false } },
        { scope: this.getScope(req) }
      );


      if (!updatedItems) {
        res.status(404).json('No devices updated');
      }

      res.status(200).json({
        success: true,
        errors: [],
        status: 200,
        message: 'Devices updated successfully',
        data: ids
      });
    } catch (err: any) {
      console.error(err.message);
      res.status(500)
        .json({
          success: false,
          errors: [],
          status: 200,
          message: 'ERROR:: Stop All Devices Releted To Bill',
          data: err
        });
    }
  };

}
