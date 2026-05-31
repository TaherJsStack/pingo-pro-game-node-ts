import { ActivityFields, BaseEntity, ObjectId } from './common.interface';

export interface IAddress extends BaseEntity, ActivityFields {
  ownerId: ObjectId;
  country: string;
  address: string;
  city: string;
  postalCode: string;
  state: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}
