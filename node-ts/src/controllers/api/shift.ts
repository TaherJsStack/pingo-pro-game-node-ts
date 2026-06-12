import { Response } from 'express';
import { CRUDController } from '../base/CRUDController';
import { shiftRepository } from '../../repositories/instances';
import ShiftService from '../../services/shift.service';
import ShiftSeederService from '../../services/shift-seeder.service';
import { IShift } from '../../models/interfaces/shift.interface';
import { AuthenticatedRequest } from '../../types/auth';

export class ShiftController extends CRUDController<IShift> {
  constructor() {
    super(shiftRepository);
  }

  openShift = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

  closeShift = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const shift = await ShiftService.closeShift(req.params.id, req.body, req.authData.tenantId);
      this.sendResponse(req, res, 200, [shift], 1, 'Shift closed successfully');
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };

  getCurrentShift = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const shift = await ShiftService.getCurrentShift(req.authData.id, req.authData?.brancheId as string, req.authData.tenantId);
      this.sendResponse(req, res, 200, shift ? [shift] : [], shift ? 1 : 0);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };

  getDailySummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const data = await ShiftService.getDailySummary(req.authData?.brancheId as string, req.query.date as string | undefined, req.authData.tenantId);
      this.sendResponse(req, res, 200, [data], 1);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };

  seedMockShifts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const monthsBack = Number(req.body.monthsBack ?? 6);
      const result = await ShiftSeederService.seedForBranch({
        tenantId: req.authData.tenantId as string,
        brancheId: req.authData.brancheId as string,
        openedBy: req.authData.id,
        monthsBack,
      });
      this.sendResponse(req, res, 201, [result], 1, `Seeded ${result.created} shifts for ${result.employeeCount} employees`);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };
}
