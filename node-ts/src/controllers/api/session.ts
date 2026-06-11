import { Request, Response } from 'express';
import { SessionService } from '../../services/session.service';
import { ISession } from '../../types';
import { sessionRepository } from '../../repositories/instances';
import { SendResponse } from '../base/sendResponse';
import { AuthenticatedRequest } from '../../types/auth';

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

      res.status(responseStatus).json({
        success: true,
        errors: [],
        status: responseStatus,
        message: '',
        data: [savedItem],
        wasAddedToExisting,
      });
    } catch (err) {
      this.sendErrorResponse(req, res, err);
    }
  };

  getAllItems = async (req: Request, res: Response) => {
    let filter = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : {};
    let { brancheId } = filter;

    try {
      const items = await sessionRepository.find({ brancheId }, { sort: { createdAt: -1, activeState: 1 }, scope: this.getScope(req) });
      res.status(201).json({
        success: true,
        errors: [],
        status: 200,
        message: '',
        data: items,
      });
    } catch (err) {
      this.sendErrorResponse(req, res, err);
    }
  };

  getItemById = async (req: Request, res: Response) => {
    try {
      const item = await sessionRepository.findById(req.params.id, this.getScope(req));
      if (!item) {
        return res.status(404).json({ msg: 'Item not found' });
      }
      res.status(200).json({
        success: true,
        errors: [],
        status: 200,
        message: '',
        data: [item],
      });
    } catch (err) {
      this.sendErrorResponse(req, res, err);
    }
  };

  updateItem = async (req: Request, res: Response) => {
    try {
      const updatedItem = await sessionRepository.updateById(req.params.id, req.body as any, this.getScope(req));
      if (!updatedItem) {
        return res.status(404).json({ msg: 'Item not found' });
      }
      res.status(201).json({
        success: true,
        errors: [],
        status: 200,
        message: '',
        data: [updatedItem],
      });
    } catch (err) {
      this.sendErrorResponse(req, res, err);
    }
  };

  endSession = async (req: EndSessionRequest, res: Response) => {
    try {
      const result = await sessionService.endSession(req.params.id, req.body, req.authData.id, req.authData.tenantId);

      res.status(200).json({
        success: true,
        errors: [],
        status: 200,
        message: result.message,
        data: [result.session],
        bill: result.bill,
      });
    } catch (err) {
      this.sendErrorResponse(req, res, err);
    }
  };

  deleteItem = async (req: Request, res: Response) => {
    try {
      const deletedItem = await sessionRepository.deleteById(req.params.id, this.getScope(req));
      if (!deletedItem) {
        return res.status(404).json({ msg: 'Item not found' });
      }
      res.status(201).json({
        success: true,
        errors: [],
        status: 200,
        message: '',
        data: [deletedItem],
      });
    } catch (err) {
      this.sendErrorResponse(req, res, err);
    }
  };

  deleteAllReletedToBill = async (req: Request, res: Response) => {
    try {
      const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
      await sessionRepository.deleteManyByIds(ids, this.getScope(req));

      res.status(201).json({
        success: true,
        errors: [],
        status: 200,
        message: ids,
        data: ids,
      });
    } catch (err) {
      this.sendErrorResponse(req, res, err);
    }
  };
}

