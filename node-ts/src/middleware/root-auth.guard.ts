import { Response, NextFunction } from 'express';
import { AuthType } from '../enums/auth-type.enum';
import { MaybeAuthenticatedRequest } from '../types/auth';

/**
 * Restricts a route to root/admin operators. Must run AFTER `signReqData` (which populates
 * `req.authData.authType` from the JWT). Returns 403 for any non-root caller.
 */
const rootAuthGuard = (req: MaybeAuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (req.authData?.authType === AuthType.Root) {
    next();
    return;
  }
  res.status(403).json({ message: 'Root privileges are required for this operation.', status: 403 });
};

export default rootAuthGuard;
