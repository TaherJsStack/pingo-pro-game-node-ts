import { Request, Response } from 'express';
import InboxModel from '../../models/inbox';
// import { CRUDController } from './base/CRUDController';
import { IInbox } from '../../models/interfaces/inbox.interface';
import { CRUDController } from '../base/CRUDController';
const { ObjectId } = require('mongoose').Types;


export class InboxController extends CRUDController<IInbox> {
  constructor() {
    super(InboxModel);
  }

  async sendWelcomMessage(userId: string) {
    try {
      const message: IInbox = new InboxModel();
      await message.$set('ownerId', new ObjectId(userId));
      await message.$set('title', 'welcom to our inbox');
      await message.$set('type', 'welcom');
      await message.$set('context', 'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Qui perspiciatis quas aliquam natus animi quod modi ex placeat incidunt veritatis voluptatum dolore repudiandae illo vel quo, doloremque ipsum tempore deserunt.');
      const messageRes = await message.save();
      return messageRes
    } catch (error) {
      console.log('sendWelcomMessage error ---> ', error);
    }
  }

  getInbox(userId: string) {
    return InboxModel.find({ ownerId: new ObjectId(userId) });
  }
  
}
