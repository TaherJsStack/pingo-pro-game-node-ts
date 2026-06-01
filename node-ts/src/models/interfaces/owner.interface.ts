import { ActivityFields, BaseEntity } from './common.interface';

export interface IOwner extends BaseEntity, ActivityFields {
  name: string;
  email: string;
  role: number;
  permission: number[];
  imageUrl: string;
  governorate: string;
  city: string;
  area: string;
  mobile: string;
  floorNo: string;
  streetNo: string;
  buildingNo: string;
  apartmentNo: string;
  title: string;
  imgPath: string;
  showInWebSite: boolean;
}
