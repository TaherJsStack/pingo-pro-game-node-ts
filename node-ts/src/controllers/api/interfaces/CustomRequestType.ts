import { Request } from 'express';

export interface CreateItemRequest<T> extends Request {
  body: T;
  authData: {
    id: string;
  };
}