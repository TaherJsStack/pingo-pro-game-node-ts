import { Request, Response } from 'express';
// import { CRUDController } from './base/CRUDController';
import { IInbox } from '../../types';
import { CRUDController } from '../base/CRUDController';
import { inboxRepository } from '../../repositories/instances';
import { InboxType } from '../../enums/inbox-type.enum';
import InboxModel from '../../models/inbox';
import { AuthenticatedRequest } from '../../types/auth';
const { ObjectId } = require('mongoose').Types;


export class InboxController extends CRUDController<IInbox> {
  constructor() {
    super(inboxRepository);
  }

  async sendWelcomMessage(userId: string) {
    try {
      const messageRes = await this.repository.create({
        ownerId: new ObjectId(userId),
        title: 'welcom to our inbox',
        type: InboxType.Welcome,
        context:
          'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Qui perspiciatis quas aliquam natus animi quod modi ex placeat incidunt veritatis voluptatum dolore repudiandae illo vel quo, doloremque ipsum tempore deserunt.',
      } as any);
      return messageRes
    } catch (error) {
      // console.log('sendWelcomMessage error ---> ', error);
    }
  }

  getInbox(userId: string) {
    return this.repository.find({ ownerId: new ObjectId(userId) });
  }

  public getAllItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const filter: Record<string, unknown> = {
        ownerId: new ObjectId(authReq.authData.id),
        activeState: true,
      };
      if (typeof req.query.isSeen !== 'undefined') {
        filter.isSeen = req.query.isSeen === 'true';
      }

      const items = await this.repository.find(filter, {
        sort: { createdAt: -1 },
        scope: this.getRequestScope(req),
      });
      this.sendResponse(req, res, 200, items);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };

  public getUnreadCount = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const count = await InboxModel.countDocuments({
        ownerId: new ObjectId(authReq.authData.id),
        isSeen: false,
        activeState: true,
      });

      res.json({ count });
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };

  public markSeen = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const doc = await InboxModel.findOneAndUpdate(
        {
          _id: req.params.id,
          ownerId: new ObjectId(authReq.authData.id),
        },
        { isSeen: true },
        { new: true },
      );

      if (!doc) {
        res.status(404).json({ message: 'Not found' });
        return;
      }

      this.sendResponse(req, res, 200, [doc]);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };
  
}
