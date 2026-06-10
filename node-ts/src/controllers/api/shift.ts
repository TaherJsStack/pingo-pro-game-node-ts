import { Request, Response } from 'express';
import { CRUDController } from '../base/CRUDController';
import { shiftRepository } from '../../repositories/instances';
import ShiftService from '../../services/shift.service';
import { IShift } from '../../models/interfaces/shift.interface';

interface ShiftRequest extends Request {
  authData: {
    id: string;
    tenantId?: string;
  };
}

export class ShiftController extends CRUDController<IShift> {
  constructor() {
    super(shiftRepository);
  }

  openShift = async (req: ShiftRequest, res: Response): Promise<void> => {
    try {
      const employeeId = req.body.employeeId ?? req.authData.id;
      const shift = await ShiftService.openShift({
        employeeId,
        tenantId: req.authData.tenantId,
        brancheId: (req as any).authData?.brancheId,
        openingCash: req.body.openingCash,
        openedBy: req.authData.id,
        clientRequestId: (req as any).idempotency?.key ?? (req.body as any).clientRequestId,
      });
      this.sendResponse(req, res, 201, [shift], 1, 'Shift opened successfully');
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };

  closeShift = async (req: ShiftRequest, res: Response): Promise<void> => {
    try {
      const shift = await ShiftService.closeShift(req.params.id, req.body, req.authData.tenantId);
      this.sendResponse(req, res, 200, [shift], 1, 'Shift closed successfully');
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };

  getCurrentShift = async (req: ShiftRequest, res: Response): Promise<void> => {
    try {
      const shift = await ShiftService.getCurrentShift(req.authData.id, req.query.brancheId as string, req.authData.tenantId);
      this.sendResponse(req, res, 200, shift ? [shift] : [], shift ? 1 : 0);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };

  getDailySummary = async (req: ShiftRequest, res: Response): Promise<void> => {
    try {
      const data = await ShiftService.getDailySummary(req.query.brancheId as string, req.query.date as string | undefined, req.authData.tenantId);
      this.sendResponse(req, res, 200, [data], 1);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };
}
