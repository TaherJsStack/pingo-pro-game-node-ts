import { Request, Response } from 'express';
// import { CRUDController } from './base/CRUDController';
import { IInbox } from '../../types';
import { CRUDController } from '../base/CRUDController';
import { inboxRepository } from '../../repositories/instances';
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
        type: 'welcom',
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
  
}

