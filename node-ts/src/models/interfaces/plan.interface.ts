import { BaseEntity } from './common.interface';

export interface IPlan extends BaseEntity {
  name: string;
  description: string;
  price: number;
  durationMonths: number;
}
