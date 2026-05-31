import { Request, Response } from 'express';

export interface DeleteOperation<T extends object> {
  deleteItem(req: Request, res: Response): Promise<void>;
}
