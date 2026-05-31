import { Request, Response } from 'express';
import AuditModel from '../../models/audit';
// import { CRUDController } from './base/CRUDController';
import { CRUDController } from '../base/CRUDController';
import { IAudit } from '../../models/interfaces/audit.interface';


export class AuditController {
  constructor() {
    // super(AuditModel);
  }

   async createAuditItem(data: Partial<IAudit>): Promise<void> {
    try {
      const newItem = new AuditModel(data);
      await newItem.save();
      // console.log('Audit item created successfully:', newItem);
    } catch (error) {
      console.error('Error creating audit item:', error);
    }
   }
}
