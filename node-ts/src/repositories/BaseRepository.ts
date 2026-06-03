import { Model } from 'mongoose';
import { IRepository, PaginatedResult, RepositoryFindOptions } from './interfaces/IRepository';

export class BaseRepository<T extends Record<string, any>> implements IRepository<T> {
  constructor(protected readonly model: Model<any>) {}

  public async findById(id: string): Promise<any | null> {
    return this.model.findById(id);
  }

  public async findOne(filter: Record<string, any>): Promise<any | null> {
    return this.model.findOne(filter);
  }

  public async find(filter: Record<string, any> = {}, options?: RepositoryFindOptions): Promise<any[]> {
    const query = this.model.find(filter);

    if (options?.sort) {
      query.sort(options.sort);
    }
    if (typeof options?.skip === 'number') {
      query.skip(options.skip);
    }
    if (typeof options?.limit === 'number') {
      query.limit(options.limit);
    }

    return query;
  }

  public async paginate(filter: Record<string, any>, page: number, size: number): Promise<PaginatedResult<any>> {
    const pageNo = Number(page) > 0 ? Number(page) : 1;
    const pageSize = Number(size) > 0 ? Number(size) : 10;
    const skip = (pageNo - 1) * pageSize;

    const safeFilter = this.buildPaginatedFilter(filter);
    const totalData = await this.model.find(safeFilter).countDocuments();
    const items = await this.model.find(safeFilter).sort({ createdAt: -1, activeState: 1 }).skip(skip).limit(pageSize);

    return {
      items,
      totalData,
      page: pageNo,
      pageSize,
      filter: safeFilter,
    };
  }

  public async countDocuments(filter: Record<string, any> = {}): Promise<number> {
    return this.model.find(filter).countDocuments();
  }

  public async create(data: Partial<T>): Promise<any> {
    const newItem = new this.model(data);
    return newItem.save();
  }

  public async updateById(id: string, data: Partial<T>): Promise<any | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true });
  }

  public async findOneAndUpdate(
    filter: Record<string, any>,
    update: Record<string, any>,
    options?: Record<string, any>
  ): Promise<any | null> {
    return this.model.findOneAndUpdate(filter, update, { new: true, ...options });
  }

  public async updateMany(
    filter: Record<string, any>,
    update: Record<string, any>,
    options?: Record<string, any>
  ): Promise<any> {
    return this.model.updateMany(filter, update, options);
  }

  public async deleteById(id: string): Promise<any | null> {
    return this.model.findByIdAndDelete(id);
  }

  public async aggregate<TResult = any>(pipeline: any[]): Promise<TResult[]> {
    return this.model.aggregate(pipeline as any);
  }

  public async updateOne(
    filter: Record<string, any>,
    update: Record<string, any>,
    options?: Record<string, any>
  ): Promise<any> {
    return this.model.updateOne(filter, update, options);
  }

  public async deleteMany(filter: Record<string, any>): Promise<any> {
    return this.model.deleteMany(filter);
  }

  private buildPaginatedFilter(rawFilter: Record<string, any> = {}): Record<string, any> {
    const filter = { ...rawFilter };
    const startDate = filter.startDate ? new Date(filter.startDate) : null;
    const endDate = filter.endDate ? new Date(filter.endDate) : null;
    const searchKeyword = filter.searchKeyword ?? '';

    for (const property in filter) {
      if (!(property in this.model.schema.obj)) {
        delete filter[property];
      }
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$lte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$gte = new Date(endDate);
      }
    }

    if (typeof filter.activeState === 'undefined' || filter.activeState === null || filter.activeState === '') {
      delete filter.activeState;
    } else if (typeof filter.activeState === 'string') {
      filter.activeState = filter.activeState === 'true';
    }

    if (typeof searchKeyword !== 'undefined' && searchKeyword !== null && searchKeyword !== '') {
      filter.$text = { $search: searchKeyword };
    }

    return filter;
  }
}
