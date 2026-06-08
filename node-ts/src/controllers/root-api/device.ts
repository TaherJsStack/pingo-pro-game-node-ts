import { Request, Response } from 'express';
import { Types } from 'mongoose';
import DeviceModel from '../../models/device';
import { IDevice } from '../../models/interfaces/device.interface';
import { CRUDController } from '../base/CRUDController';
import { BaseRepository } from '../../repositories/BaseRepository';

export class DeviceController extends CRUDController<IDevice> {
  constructor() {
    super(new BaseRepository<IDevice>(DeviceModel));
  }

  override getAllItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const items = await this.repository.find({}, { sort: { createdAt: -1, activeState: 1 } });
      this.sendResponse(req, res, 200, items);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };


}
