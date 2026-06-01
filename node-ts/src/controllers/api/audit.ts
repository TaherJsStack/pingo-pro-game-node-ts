import { Request, Response } from 'express';
import { IAudit } from '../../types';
import { auditRepository } from '../../repositories/instances';


export class AuditController {
  constructor() {
    // super(AuditModel);
  }

   async createAuditItem(data: Partial<IAudit>): Promise<void> {
    try {
      await auditRepository.create(data as any);
      // console.log('Audit item created successfully:', newItem);
    } catch (error) {
      console.error('Error creating audit item:', error);
    }
   }
}

