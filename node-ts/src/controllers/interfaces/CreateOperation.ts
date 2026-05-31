import { Request, Response } from 'express';
import { CreateItemRequest } from './CustomRequestType';

export interface CreateOperation<T extends object> {
  createItem(req: CreateItemRequest<T>, res: Response): Promise<void>;
}
