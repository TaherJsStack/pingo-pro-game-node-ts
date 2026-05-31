import { Request, Response } from 'express';

export interface UpdateOperation<T extends object> {
  updateItem(req: Request, res: Response): Promise<void>;
}
