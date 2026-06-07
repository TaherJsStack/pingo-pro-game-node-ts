import { ActivityFields, BaseEntity, ObjectId } from './common.interface';

export interface IAddress extends BaseEntity, ActivityFields {
  ownerId: ObjectId;
  tenantId?: ObjectId | null;
  country: string;
  address: string;
  city: string;
  postalCode: string;
  state: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
}
