import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { SendResponse } from '../base/sendResponse';
import NotificationOutboxModel from '../../models/notification-outbox';

export class NotificationsController extends SendResponse {
  async getOutboxHistory(req: Request, res: Response): Promise<void> {

    try {
      const authData = (req as any).authData;
      // console.log("authData -------->", authData)
      if (!authData?.tenantId) {
        res.status(401).json({ message: 'Tenant context is required' });
        return;
      }

      const page = Math.max(1, Number(req.query.pageNo ?? 1));
      const pageSize = Math.max(1, Number(req.query.pageSize ?? 10));
      const filter: Record<string, any> = {
        tenantId: new Types.ObjectId(authData.tenantId),
      };

      if (req.query.status) {
        filter.status = String(req.query.status);
      }

      if (req.query.eventType) {
        filter.eventType = String(req.query.eventType);
      }

      const [items, totalData] = await Promise.all([
        NotificationOutboxModel.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .lean()
          .exec(),
        NotificationOutboxModel.countDocuments(filter),
      ]);

      // console.log("totalData --------->", totalData)
      // console.log("items --------->", items)

      this.sendResponse(req, res, 200, items, totalData);
    } catch (error: any) {
      this.sendErrorResponse(req, res, error);
    }
  }
}

export default new NotificationsController();
