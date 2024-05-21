import { Document, Model } from 'mongoose';
import { Request, Response } from 'express';
import { CreateItemRequest } from './CustomRequestType';

// Interface for Create operation
export interface CreateOperation<T extends Document> {
  createItem(req: CreateItemRequest<T>, res: Response): Promise<void>;
}