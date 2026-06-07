import { Model, Types } from 'mongoose';
import {
  IRepository,
  PaginatedResult,
  RepositoryFindOptions,
  RepositoryMutationOptions,
  RepositoryScope,
} from './interfaces/IRepository';

export class BaseRepository<T extends Record<string, any>> implements IRepository<T> {
  private readonly isTenantScopedModel: boolean;

  constructor(protected readonly model: Model<any>) {
    this.isTenantScopedModel = Boolean(this.model.schema.path('tenantId'));
  }

  public async findById(id: string, scope?: RepositoryScope): Promise<any | null> {
    return this.model.findOne(this.buildScopedFilter({ _id: new Types.ObjectId(id) }, scope));
  }

  public async findOne(filter: Record<string, any>, scope?: RepositoryScope): Promise<any | null> {
    return this.model.findOne(this.buildScopedFilter(filter, scope));
  }

  public async find(filter: Record<string, any> = {}, options?: RepositoryFindOptions): Promise<any[]> {
    const query = this.model.find(this.buildScopedFilter(filter, options?.scope));

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

  public async paginate(filter: Record<string, any>, page: number, size: number, scope?: RepositoryScope): Promise<PaginatedResult<any>> {
    const pageNo = Number(page) > 0 ? Number(page) : 1;
    const pageSize = Number(size) > 0 ? Number(size) : 10;
    const skip = (pageNo - 1) * pageSize;

    const safeFilter = this.buildPaginatedFilter(this.buildScopedFilter(filter, scope));
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

  public async countDocuments(filter: Record<string, any> = {}, scope?: RepositoryScope): Promise<number> {
    return this.model.find(this.buildScopedFilter(filter, scope)).countDocuments();
  }

  public async create(data: Partial<T>, scope?: RepositoryScope): Promise<any> {
    const payload = this.applyTenantToPayload(data, scope);
    const newItem = new this.model(payload);
    return newItem.save();
  }

  public async upsertByClientRequestId(
    data: Partial<T> & { clientRequestId?: string },
    scope?: RepositoryScope
  ): Promise<{ item: any; created: boolean }> {
    const clientRequestId = data.clientRequestId;
    if (!clientRequestId) {
      return {
        item: await this.create(data, scope),
        created: true,
      };
    }

    const filter = this.buildScopedFilter({ clientRequestId }, scope);
    const existing = await this.model.findOne(filter);
    if (existing) {
      return {
        item: existing,
        created: false,
      };
    }

    try {
      return {
        item: await this.create(data, scope),
        created: true,
      };
    } catch (error: any) {
      if (error?.code !== 11000) {
        throw error;
      }

      const winner = await this.model.findOne(filter);
      if (winner) {
        return {
          item: winner,
          created: false,
        };
      }

      throw error;
    }
  }

  public async updateById(id: string, data: Partial<T>, scope?: RepositoryScope): Promise<any | null> {
    return this.model.findOneAndUpdate(
      this.buildScopedFilter({ _id: new Types.ObjectId(id) }, scope),
      this.applyTenantToPayload(data, scope),
      { new: true }
    );
  }

  public async findOneAndUpdate(
    filter: Record<string, any>,
    update: Record<string, any>,
    options?: RepositoryMutationOptions
  ): Promise<any | null> {
    const { scope, ...queryOptions } = options ?? {};
    return this.model.findOneAndUpdate(
      this.buildScopedFilter(filter, scope),
      this.applyTenantToPayload(update, scope),
      { new: true, ...queryOptions }
    );
  }

  public async updateMany(
    filter: Record<string, any>,
    update: Record<string, any>,
    options?: RepositoryMutationOptions
  ): Promise<any> {
    const { scope, ...queryOptions } = options ?? {};
    return this.model.updateMany(
      this.buildScopedFilter(filter, scope),
      this.applyTenantToPayload(update, scope),
      queryOptions
    );
  }

  public async deleteById(id: string, scope?: RepositoryScope): Promise<any | null> {
    return this.model.findOneAndDelete(this.buildScopedFilter({ _id: new Types.ObjectId(id) }, scope));
  }

  public async aggregate<TResult = any>(pipeline: any[], scope?: RepositoryScope): Promise<TResult[]> {
    const scopedPipeline = [...pipeline];
    const tenantFilter = this.buildTenantScopeFilter(scope);
    if (tenantFilter) {
      scopedPipeline.unshift({ $match: tenantFilter });
    }
    return this.model.aggregate(scopedPipeline as any);
  }

  public async updateOne(
    filter: Record<string, any>,
    update: Record<string, any>,
    options?: RepositoryMutationOptions
  ): Promise<any> {
    const { scope, ...queryOptions } = options ?? {};
    return this.model.updateOne(
      this.buildScopedFilter(filter, scope),
      this.applyTenantToPayload(update, scope),
      queryOptions
    );
  }

  public async deleteMany(filter: Record<string, any>, scope?: RepositoryScope): Promise<any> {
    return this.model.deleteMany(this.buildScopedFilter(filter, scope));
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

  private buildScopedFilter(filter: Record<string, any> = {}, scope?: RepositoryScope): Record<string, any> {
    const scopedFilter = { ...filter };
    const tenantFilter = this.buildTenantScopeFilter(scope, scopedFilter.tenantId);
    if (tenantFilter) {
      return {
        ...scopedFilter,
        ...tenantFilter,
      };
    }
    return scopedFilter;
  }

  private buildTenantScopeFilter(
    scope?: RepositoryScope,
    fallbackTenantId?: string | { toString(): string } | null
  ): Record<string, any> | null {
    if (!this.isTenantScopedModel || scope?.bypassTenant) {
      return null;
    }

    const tenantId = scope?.tenantId ?? fallbackTenantId;
    if (!tenantId) {
      if (scope?.requireTenant) {
        throw new Error(`Tenant scope is required for ${this.model.modelName} repository operations.`);
      }
      return null;
    }

    return { tenantId: this.normalizeTenantId(tenantId) };
  }

  private applyTenantToPayload(data: Partial<T> | Record<string, any>, scope?: RepositoryScope) {
    if (!this.isTenantScopedModel || scope?.bypassTenant || !scope?.tenantId) {
      return data;
    }

    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return data;
    }

    if ('$set' in data && data.$set && typeof data.$set === 'object' && !('tenantId' in data.$set)) {
      return {
        ...data,
        $set: {
          ...data.$set,
          tenantId: this.normalizeTenantId(scope.tenantId),
        },
      };
    }

    if (!('tenantId' in data)) {
      return {
        ...data,
        tenantId: this.normalizeTenantId(scope.tenantId),
      };
    }

    return data;
  }

  private normalizeTenantId(tenantId: string | { toString(): string }) {
    const value = tenantId.toString();
    return Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : value;
  }
}
