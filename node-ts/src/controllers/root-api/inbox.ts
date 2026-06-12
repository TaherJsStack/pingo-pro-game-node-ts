import { Request, Response } from 'express';
import InboxModel from '../../models/inbox';
import { IInbox } from '../../models/interfaces/inbox.interface';
import { CRUDController } from '../base/CRUDController';
import { BaseRepository } from '../../repositories/BaseRepository';
import { InboxType } from '../../enums/inbox-type.enum';
import { RealtimeEvent } from '../../enums/realtime-event.enum';
import { getIo, getUserRoom } from '../../../socket';
const { ObjectId } = require('mongoose').Types;


export class InboxController extends CRUDController<IInbox> {
  constructor() {
    super(new BaseRepository<IInbox>(InboxModel));
  }

  public getAllItems = async (req: Request, res: Response): Promise<void> => {
    try {

      const items = await this.repository.find({}, {
        sort: { createdAt: -1, activeState: 1 },
        scope: this.getRequestScope(req),
      });
      this.sendResponse(req, res, 200, items);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };

  public sendToOwners = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ownerIds, title, context } = req.body as {
        ownerIds: string[];
        title: string;
        context: string;
      };
      const createdItems: IInbox[] = [];

      for (const ownerId of ownerIds) {
        const createdDoc = await InboxModel.create({
          ownerId: new ObjectId(ownerId),
          tenantId: null,
          title,
          context,
          type: InboxType.Admin,
          isSeen: false,
        });

        createdItems.push(createdDoc);
        getIo().to(getUserRoom(String(ownerId))).emit(RealtimeEvent.InboxMessage, createdDoc);
      }

      this.sendResponse(req, res, 200, createdItems, createdItems.length, 'Messages sent');
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };
  
}
