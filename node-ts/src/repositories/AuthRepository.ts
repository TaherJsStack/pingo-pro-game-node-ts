import { Model } from 'mongoose';
import { IAuth } from '../models/interfaces/auth.interface';
import { BaseRepository } from './BaseRepository';

export class AuthRepository extends BaseRepository<IAuth> {
  constructor(model: Model<any>) {
    super(model);
  }

  public async findByEmail(email: string): Promise<IAuth | null> {
    return this.findOne({ email }, { bypassTenant: true });
  }

  public async findByPhone(phone: string): Promise<IAuth | null> {
    return this.findOne({ phone }, { bypassTenant: true });
  }
}
