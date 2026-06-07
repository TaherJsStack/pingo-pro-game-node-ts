import { Model, Types } from 'mongoose';
import { ISession } from '../models/interfaces/session.interface';
import { BaseRepository } from './BaseRepository';
import { RepositoryScope } from './interfaces/IRepository';

export class SessionRepository extends BaseRepository<ISession> {
  constructor(model: Model<any>) {
    super(model);
  }

  public async findActiveSessionByClientAndBranch(
    clientId: any,
    brancheId: any,
    scope?: RepositoryScope
  ): Promise<any | null> {
    return this.findOne({
      clientId,
      brancheId,
      activeState: true,
    }, scope);
  }

  public async deleteManyByIds(ids: string[], scope?: RepositoryScope): Promise<any> {
    const objectIds = ids.map((id) => new Types.ObjectId(id));
    return this.deleteMany({ _id: { $in: objectIds } }, scope);
  }
}
