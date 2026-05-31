import { BaseEntity } from './common.interface';

export interface IAudit extends BaseEntity {
  action: string;
  method: string;
  baseUrl: string;
  platform?: string;
  success: string;
  status: string;
  error: string;
  auditByName: string;
  auditById: string;
  auditOn: Date;
  role: number;
  permeation: number[];
}
