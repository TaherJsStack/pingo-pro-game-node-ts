import { ActivityFields, BaseEntity } from './common.interface';

export interface IPlan extends BaseEntity, ActivityFields {
  name: string;
  price: number;
  durationMonths: number;
}
