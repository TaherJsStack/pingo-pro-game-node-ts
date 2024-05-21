import { Document, Model } from 'mongoose';
import { Request, Response } from 'express';

// Interface for Read operation
export interface ReadOperation<T extends Document> {
  getAllItems(req: Request, res: Response): Promise<void>;
  getItemById(req: Request, res: Response): Promise<void>;
}