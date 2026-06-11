import { Request } from 'express';

export interface AuthData {
  id: string;
  tenantId?: string;
  brancheId?: string;
  role: string;
  email: string;
  permission: string;
  authType?: string;
  permissions?: any;
}

/** Request where signReqData middleware has run — authData is guaranteed present. */
export interface AuthenticatedRequest extends Request {
  authData: AuthData;
}

/** Request where auth middleware is optional or authData may be absent. */
export interface MaybeAuthenticatedRequest extends Request {
  authData?: AuthData;
}
