import { Request } from 'express';

export interface CreateItemRequest<T> extends Request {
  body: T;
  authData: {
    id: string;
    tenantId?: string;
    role?: string;
    email?: string;
    permission?: string | number[];
    authType?: string;
    permissions?: any;
  };
  idempotency?: {
    key: string;
    route: string;
    requestHash: string;
    recordId: string;
  };
}
