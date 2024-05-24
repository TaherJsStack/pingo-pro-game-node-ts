import { Document, Model } from 'mongoose';
import { Request, Response } from 'express';

// Interface for Update operation
export interface UpdateOperation<T extends Document> {
    updateItem(req: Request, res: Response): Promise<void>;
  }