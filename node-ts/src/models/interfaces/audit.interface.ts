import { BaseEntity, ObjectId } from './common.interface';

export interface IAudit extends BaseEntity {
  tenantId?: ObjectId | null;
  action: string;
  method: string;
  baseUrl: string;
  platform?: string;
  success: string;
  status: string;
  error: string;
  auditByName: string;
  auditById: ObjectId;
  auditOn: Date;
  role: number;
  permission: number[];
}
