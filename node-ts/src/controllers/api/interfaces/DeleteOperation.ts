import { Document, Model } from 'mongoose';
import { Request, Response } from 'express';

// Interface for Delete operation
export interface DeleteOperation<T extends Document> {
    deleteItem(req: Request, res: Response): Promise<void>;
  }