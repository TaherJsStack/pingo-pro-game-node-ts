import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';

  res.status(statusCode).json({
    success: false,
    errors: [errorMessage],
    status: statusCode,
    message: '',
    data: {},
  });
}
