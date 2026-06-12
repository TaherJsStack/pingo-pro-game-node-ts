import { Request, Response } from 'express';
import TenantModel from '../../models/tenant';
import { ITenant } from '../../models/interfaces/tenant.interface';
import { CRUDController } from '../base/CRUDController';
import { BaseRepository } from '../../repositories/BaseRepository';
import AnalyticsService from '../../services/analytics.service';
import { KpiPeriod } from '../../enums/kpi-period.enum';

export class TenantAdminController extends CRUDController<ITenant> {
  constructor() {
    super(new BaseRepository<ITenant>(TenantModel));
  }

  override getAllItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const filter = this.parseFilter(req.query.Filter);
      const page = Number(req.query.PageNo ?? filter.pageNo ?? 1);
      const pageSize = Number(req.query.PageSize ?? filter.pageSize ?? 10);
      const pageNo = page > 0 ? page : 1;
      const size = pageSize > 0 ? pageSize : 10;
      const skip = (pageNo - 1) * size;

      const sanitizedFilter = { ...filter };
      delete sanitizedFilter.pageNo;
      delete sanitizedFilter.pageSize;

      const totalData = await this.repository.countDocuments(sanitizedFilter);
      const items = await TenantModel.find(sanitizedFilter)
        .populate('ownerId', 'email firstName lastName')
        .sort({ createdAt: -1, activeState: 1 })
        .skip(skip)
        .limit(size);

      this.sendResponse(req, res, 200, items, totalData);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };

  toggleActive = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenant = await this.repository.findById(req.params.id);
      if (!tenant) {
        res.status(404).json({ msg: 'Item not found' });
        return;
      }

      tenant.activeState = !tenant.activeState;
      const updatedTenant = await tenant.save();
      this.sendResponse(req, res, 200, [updatedTenant], 1);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };

  getTenantKpi = async (req: Request, res: Response): Promise<void> => {
    try {
      const filterObg = typeof req.query.Filter === 'string'
        ? JSON.parse(req.query.Filter)
        : ((req.query.Filter as any) || {});

      const innerFilter = filterObg.filter || filterObg;
      const startDate = innerFilter.startDate ? new Date(innerFilter.startDate) : new Date(0);
      const endDate = innerFilter.endDate ? new Date(innerFilter.endDate) : new Date();
      const allowedPeriods: KpiPeriod[] = Object.values(KpiPeriod);
      const requested = innerFilter.period || filterObg.period || KpiPeriod.Day;
      const period: KpiPeriod = allowedPeriods.includes(requested) ? requested : KpiPeriod.Day;

      const summary = await AnalyticsService.getTenantKpiSummary({
        tenantId: req.params.id,
        brancheId: innerFilter.brancheId ? String(innerFilter.brancheId) : undefined,
        startDate,
        endDate,
        period,
      });

      this.sendResponse(req, res, 200, [summary], 1);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };
}
