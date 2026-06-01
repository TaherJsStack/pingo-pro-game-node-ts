import { Request, Response } from 'express';
import mongoose, { Model, Schema } from 'mongoose';
import { CRUDController } from '../../src/controllers/base/CRUDController';
import { BaseRepository } from '../../src/repositories/BaseRepository';

interface ICrudTestEntity {
  ownerId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  brancheId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  activeState: boolean;
  createdAt: Date;
  logo?: string;
}

const CrudTestSchema = new Schema<ICrudTestEntity>(
  {
    ownerId: { type: Schema.Types.ObjectId, required: true },
    createdBy: { type: Schema.Types.ObjectId, required: true },
    brancheId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    activeState: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    logo: { type: String, default: '' },
  },
  { timestamps: true }
);

CrudTestSchema.index({ name: 'text', description: 'text' });

const CRUD_TEST_MODEL_NAME = 'CrudControllerCharacterization';
const CrudTestModel: Model<ICrudTestEntity> =
  (mongoose.models[CRUD_TEST_MODEL_NAME] as Model<ICrudTestEntity>) ||
  mongoose.model<ICrudTestEntity>(CRUD_TEST_MODEL_NAME, CrudTestSchema);

class CrudTestController extends CRUDController<ICrudTestEntity> {
  constructor() {
    super(new BaseRepository<ICrudTestEntity>(CrudTestModel));
  }
}

type MockResponse = Response & {
  status: jest.Mock;
  json: jest.Mock;
};

const createId = () => new mongoose.Types.ObjectId();

const createMockResponse = (): MockResponse => {
  const response = {} as MockResponse;
  response.status = jest.fn().mockReturnValue(response);
  response.json = jest.fn().mockReturnValue(response);
  return response;
};

const createMockRequest = (overrides: Partial<Request> = {}): Request =>
  ({
    url: '/api/test',
    method: 'GET',
    baseUrl: '/api/test',
    headers: {},
    protocol: 'http',
    get: jest.fn().mockReturnValue('localhost:4001'),
    query: {},
    params: {},
    body: {},
    ...overrides,
  } as Request);

describe('CRUDController characterization', () => {
  let controller: CrudTestController;

  beforeAll(async () => {
    await CrudTestModel.syncIndexes();
  });

  beforeEach(() => {
    controller = new CrudTestController();
  });

  it('createItem sets ownerId/createdBy from authData and returns the standard response envelope', async () => {
    const userId = createId();
    const req = createMockRequest({
      method: 'POST',
      body: {
        brancheId: createId(),
        name: 'Alpha',
        description: 'First item',
      },
      authData: { id: userId.toString() },
    } as unknown as Partial<Request>);
    const res = createMockResponse();

    await controller.createItem(req as any, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const payload = res.json.mock.calls[0][0];
    expect(payload).toMatchObject({
      success: true,
      errors: [],
      status: 201,
      message: '',
      totalData: 1,
    });
    expect(payload.data).toHaveLength(1);

    const created = await CrudTestModel.findById(payload.data[0]._id).orFail();
    expect(String(created.ownerId)).toBe(userId.toString());
    expect(String(created.createdBy)).toBe(userId.toString());
  });

  it('getAllItems supports activeState filter and pagination with current sorting behavior', async () => {
    const ownerId = createId();
    const createdBy = createId();
    const brancheId = createId();

    await CrudTestModel.insertMany([
      {
        ownerId,
        createdBy,
        brancheId,
        name: 'Alpha',
        description: 'first',
        activeState: true,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
      },
      {
        ownerId,
        createdBy,
        brancheId,
        name: 'Beta',
        description: 'second',
        activeState: false,
        createdAt: new Date('2025-02-01T00:00:00.000Z'),
      },
      {
        ownerId,
        createdBy,
        brancheId,
        name: 'Gamma',
        description: 'third',
        activeState: true,
        createdAt: new Date('2025-03-01T00:00:00.000Z'),
      },
    ]);

    const req = createMockRequest({
      query: {
        Filter: JSON.stringify({
          activeState: 'true',
          pageNo: 1,
          pageSize: 1,
        }),
      },
    } as unknown as Partial<Request>);
    const res = createMockResponse();

    await controller.getAllItems(req, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.totalData).toBe(2);
    expect(payload.data).toHaveLength(1);
    expect(payload.data[0].name).toBe('Gamma');
  });

  it('getAllItems supports $text search via searchKeyword', async () => {
    const ownerId = createId();
    const createdBy = createId();
    const brancheId = createId();

    await CrudTestModel.insertMany([
      {
        ownerId,
        createdBy,
        brancheId,
        name: 'Alpha',
        description: 'find keyword here',
        activeState: true,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
      },
      {
        ownerId,
        createdBy,
        brancheId,
        name: 'Beta',
        description: 'no match',
        activeState: true,
        createdAt: new Date('2025-02-01T00:00:00.000Z'),
      },
    ]);

    const req = createMockRequest({
      query: {
        Filter: JSON.stringify({
          searchKeyword: 'keyword',
          pageNo: 1,
          pageSize: 10,
        }),
      },
    } as unknown as Partial<Request>);
    const res = createMockResponse();

    await controller.getAllItems(req, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.totalData).toBe(1);
    expect(payload.data).toHaveLength(1);
    expect(payload.data[0].name).toBe('Alpha');
  });

  it('getAllItems keeps current date-range behavior (startDate => $lte, endDate => $gte)', async () => {
    const ownerId = createId();
    const createdBy = createId();
    const brancheId = createId();

    await CrudTestModel.insertMany([
      {
        ownerId,
        createdBy,
        brancheId,
        name: 'Early',
        description: 'early',
        activeState: true,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
      },
      {
        ownerId,
        createdBy,
        brancheId,
        name: 'Middle',
        description: 'middle',
        activeState: true,
        createdAt: new Date('2025-02-01T00:00:00.000Z'),
      },
      {
        ownerId,
        createdBy,
        brancheId,
        name: 'Late',
        description: 'late',
        activeState: true,
        createdAt: new Date('2025-03-01T00:00:00.000Z'),
      },
    ]);

    const req = createMockRequest({
      query: {
        Filter: JSON.stringify({
          startDate: '2025-02-15T00:00:00.000Z',
          endDate: '2025-01-15T00:00:00.000Z',
          pageNo: 1,
          pageSize: 10,
        }),
      },
    } as unknown as Partial<Request>);
    const res = createMockResponse();

    await controller.getAllItems(req, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.totalData).toBe(1);
    expect(payload.data).toHaveLength(1);
    expect(payload.data[0].name).toBe('Middle');
  });

  it('updateItem updates an existing item and returns the standard response envelope', async () => {
    const created = await CrudTestModel.create({
      ownerId: createId(),
      createdBy: createId(),
      brancheId: createId(),
      name: 'Old Name',
      description: 'Old description',
      activeState: true,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
    });

    const req = createMockRequest({
      method: 'PUT',
      params: { id: created._id.toString() },
      body: {
        name: 'New Name',
        description: 'New description',
      },
    } as unknown as Partial<Request>);
    const res = createMockResponse();

    await controller.updateItem(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload).toMatchObject({
      success: true,
      errors: [],
      status: 200,
    });
    expect(payload.data[0].name).toBe('New Name');

    const updated = await CrudTestModel.findById(created._id).orFail();
    expect(updated.name).toBe('New Name');
  });

  it('deleteItem removes an item and returns updated totalData', async () => {
    const itemToDelete = await CrudTestModel.create({
      ownerId: createId(),
      createdBy: createId(),
      brancheId: createId(),
      name: 'Delete me',
      description: 'delete',
      activeState: true,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
    });

    await CrudTestModel.create({
      ownerId: createId(),
      createdBy: createId(),
      brancheId: createId(),
      name: 'Keep me',
      description: 'keep',
      activeState: true,
      createdAt: new Date('2025-01-02T00:00:00.000Z'),
    });

    const req = createMockRequest({
      method: 'DELETE',
      params: { id: itemToDelete._id.toString() },
    } as unknown as Partial<Request>);
    const res = createMockResponse();

    await controller.deleteItem(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.totalData).toBe(1);
    expect(payload.data[0]._id.toString()).toBe(itemToDelete._id.toString());

    const deleted = await CrudTestModel.findById(itemToDelete._id);
    expect(deleted).toBeNull();
  });
});
