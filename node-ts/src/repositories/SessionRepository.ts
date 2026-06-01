import { Model, Types } from 'mongoose';
import { ISession } from '../models/interfaces/session.interface';
import { BaseRepository } from './BaseRepository';

export class SessionRepository extends BaseRepository<ISession> {
  constructor(model: Model<any>) {
    super(model);
  }

  public async findActiveSessionByClientAndBranch(clientId: any, brancheId: any): Promise<any | null> {
    return this.findOne({
      clientId,
      brancheId,
      activeState: true,
    });
  }

  public async deleteManyByIds(ids: string[]): Promise<any> {
    const objectIds = ids.map((id) => new Types.ObjectId(id));
    return this.deleteMany({ _id: { $in: objectIds } });
  }
}
