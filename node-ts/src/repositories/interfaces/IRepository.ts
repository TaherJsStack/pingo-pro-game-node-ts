export interface RepositoryFindOptions {
  sort?: Record<string, 1 | -1>;
  skip?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  totalData: number;
  page: number;
  pageSize: number;
  filter: Record<string, any>;
}

export interface IRepository<T extends object> {
  findById(id: string): Promise<any | null>;
  findOne(filter: Record<string, any>): Promise<any | null>;
  find(filter?: Record<string, any>, options?: RepositoryFindOptions): Promise<any[]>;
  paginate(filter: Record<string, any>, page: number, size: number): Promise<PaginatedResult<any>>;
  countDocuments(filter?: Record<string, any>): Promise<number>;
  create(data: Partial<T>): Promise<any>;
  updateById(id: string, data: Partial<T>): Promise<any | null>;
  findOneAndUpdate(filter: Record<string, any>, update: Record<string, any>, options?: Record<string, any>): Promise<any | null>;
  updateMany(filter: Record<string, any>, update: Record<string, any>, options?: Record<string, any>): Promise<any>;
  updateOne(filter: Record<string, any>, update: Record<string, any>, options?: Record<string, any>): Promise<any>;
  aggregate<TResult = any>(pipeline: any[]): Promise<TResult[]>;
  deleteById(id: string): Promise<any | null>;
}
