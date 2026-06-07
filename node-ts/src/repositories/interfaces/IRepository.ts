export interface RepositoryFindOptions {
  sort?: Record<string, 1 | -1>;
  skip?: number;
  limit?: number;
  scope?: RepositoryScope;
}

export interface RepositoryScope {
  tenantId?: string | { toString(): string } | null;
  requireTenant?: boolean;
  bypassTenant?: boolean;
}

export interface RepositoryMutationOptions {
  scope?: RepositoryScope;
  [key: string]: any;
}

export interface PaginatedResult<T> {
  items: T[];
  totalData: number;
  page: number;
  pageSize: number;
  filter: Record<string, any>;
}

export interface IRepository<T extends object> {
  findById(id: string, scope?: RepositoryScope): Promise<any | null>;
  findOne(filter: Record<string, any>, scope?: RepositoryScope): Promise<any | null>;
  find(filter?: Record<string, any>, options?: RepositoryFindOptions): Promise<any[]>;
  paginate(filter: Record<string, any>, page: number, size: number, scope?: RepositoryScope): Promise<PaginatedResult<any>>;
  countDocuments(filter?: Record<string, any>, scope?: RepositoryScope): Promise<number>;
  create(data: Partial<T>, scope?: RepositoryScope): Promise<any>;
  updateById(id: string, data: Partial<T>, scope?: RepositoryScope): Promise<any | null>;
  findOneAndUpdate(
    filter: Record<string, any>,
    update: Record<string, any>,
    options?: RepositoryMutationOptions
  ): Promise<any | null>;
  updateMany(filter: Record<string, any>, update: Record<string, any>, options?: RepositoryMutationOptions): Promise<any>;
  updateOne(filter: Record<string, any>, update: Record<string, any>, options?: RepositoryMutationOptions): Promise<any>;
  aggregate<TResult = any>(pipeline: any[], scope?: RepositoryScope): Promise<TResult[]>;
  deleteById(id: string, scope?: RepositoryScope): Promise<any | null>;
  deleteMany(filter: Record<string, any>, scope?: RepositoryScope): Promise<any>;
}
