import { Request, Response } from 'express';
import AuditModel from '../../models/audit';
// import { CRUDController } from './base/CRUDController';
import { CRUDController } from '../base/CRUDController';
import { IAudit } from '../../models/interfaces/audit.interface';
import { BaseRepository } from '../../repositories/BaseRepository';


export class AuditController  extends CRUDController<IAudit>{
  constructor() {
    super(new BaseRepository<IAudit>(AuditModel));
  }

  override getAllItems = async (req: Request, res: Response): Promise<void> => {
    try {
      // const filter = this.parseFilter(req.query.Filter);
      // console.log('Clients getAllItems filter -->', filter);
      // console.log('filter -->', this.model);
      // for (const property in filter) {
      //   // console.log(`${property}: ${filter[property]}`);
      //   if (!(property in this.model.schema.obj)) {
      //     delete filter[property];
      //   }
      // }
      // console.log('filter -->', filter);

      const items = await this.repository.find({}, { sort: { auditOn: -1 } });
      this.sendResponse(req, res, 200, items);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };


}
