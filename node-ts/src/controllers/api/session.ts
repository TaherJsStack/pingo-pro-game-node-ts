import { Request, Response } from 'express';
import { SessionService } from '../../services/session.service';
import { ISession } from '../../types';
import { sessionRepository } from '../../repositories/instances';
import { SendResponse } from '../base/sendResponse';
import { AuthenticatedRequest } from '../../types/auth';
import { NotFoundError } from '../../errors/AppError';
import { parseFilter } from '../../util/parse-filter';

const sessionService = new SessionService();

type CreateItemRequest = AuthenticatedRequest & { body: ISession };

type EndSessionRequest = AuthenticatedRequest & {
  body: Partial<ISession> & {
    deviceId?: string;
    devicesIds?: string[];
    endTime?: string;
    description?: string;
    name?: string;
    phone?: string;
  };
};

export class SessionController extends SendResponse {
  private getScope(req: Request) {
    return { tenantId: (req as any).authData?.tenantId, requireTenant: true };
  }

  createItem = async (req: CreateItemRequest, res: Response) => {
    try {
      const body = { ...req.body, brancheId: (req as any).authData?.brancheId };
      const result = await sessionService.createItem(
        {
          ...body,
          clientRequestId: (req as any).idempotency?.key ?? (req.body as any).clientRequestId,
        } as any,
        req.authData.id,
        req.authData.tenantId
      );
      const { item: savedItem, wasAddedToExisting } = typeof result === 'object' && 'item' in result
        ? result as { item: any; wasAddedToExisting: boolean }
        : { item: result, wasAddedToExisting: false };

      const responseStatus = savedItem?.activeState ? 201 : 200;
      this.sendResponse(req, res, responseStatus, [savedItem], 1, '', { wasAddedToExisting });
    } catch (err) {
      this.sendErrorResponse(req, res, err);
    }
  };

  getAllItems = async (req: Request, res: Response) => {
    parseFilter(req.query.Filter);
    const brancheId = (req as any).authData?.brancheId;

    try {
      const items = await sessionRepository.find({ brancheId }, { sort: { createdAt: -1, activeState: 1 }, scope: this.getScope(req) });
      this.sendResponse(req, res, 200, items);
    } catch (err) {
      this.sendErrorResponse(req, res, err);
    }
  };

  getItemById = async (req: Request, res: Response) => {
    try {
      const item = await sessionRepository.findById(req.params.id, this.getScope(req));
      if (!item) {
        throw new NotFoundError('Item not found');
      }
      this.sendResponse(req, res, 200, [item]);
    } catch (err) {
      this.sendErrorResponse(req, res, err);
    }
  };

  updateItem = async (req: Request, res: Response) => {
    try {
      const allowed: Record<string, any> = {};
      if ('description' in req.body) allowed.description = req.body.description;
      if ('clientId' in req.body) allowed.clientId = req.body.clientId;

      const updatedItem = await sessionRepository.updateById(req.params.id, allowed as any, this.getScope(req));
      if (!updatedItem) {
        throw new NotFoundError('Item not found');
      }
      this.sendResponse(req, res, 200, [updatedItem]);
    } catch (err) {
      this.sendErrorResponse(req, res, err);
    }
  };

  endSession = async (req: EndSessionRequest, res: Response) => {
    try {
      const result = await sessionService.endSession(req.params.id, req.body, req.authData.id, req.authData.tenantId);
      this.sendResponse(req, res, 200, [result.session], 1, result.message, { bill: result.bill });
    } catch (err) {
      this.sendErrorResponse(req, res, err);
    }
  };

  deleteItem = async (req: Request, res: Response) => {
    try {
      const deletedItem = await sessionRepository.deleteById(req.params.id, this.getScope(req));
      if (!deletedItem) {
        throw new NotFoundError('Item not found');
      }
      this.sendResponse(req, res, 200, [deletedItem]);
    } catch (err) {
      this.sendErrorResponse(req, res, err);
    }
  };

  deleteAllRelatedToBill = async (req: Request, res: Response) => {
    try {
      const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
      await sessionRepository.deleteManyByIds(ids, this.getScope(req));
      this.sendResponse(req, res, 200, ids, ids.length);
    } catch (err) {
      this.sendErrorResponse(req, res, err);
    }
  };
}
