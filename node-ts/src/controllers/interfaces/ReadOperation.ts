import { Request, Response } from 'express';

export interface ReadOperation<T extends object> {
  getAllItems(req: Request, res: Response): Promise<void>;
  getItemById(req: Request, res: Response): Promise<void>;
}
