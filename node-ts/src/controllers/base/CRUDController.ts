import { Request, Response } from 'express';
const { ObjectId } = require('mongoose').Types;
import { CreateItemRequest } from '../interfaces/CustomRequestType';
import { CreateOperation } from '../interfaces/CreateOperation';
import { ReadOperation } from '../interfaces/ReadOperation';
import { DeleteOperation } from '../interfaces/DeleteOperation';
import { UpdateOperation } from '../interfaces/UpdateOperation';
import { SendResponse } from './sendResponse';
import { IRepository, RepositoryScope } from '../../repositories/interfaces/IRepository';
import { buildUploadUrl } from '../../util/uploads';

export abstract class CRUDController<T extends object> extends SendResponse
  implements CreateOperation<T>, ReadOperation<T>, UpdateOperation<T>, DeleteOperation<T> {

  getScope(req: Request) {
    return { tenantId: (req as any).authData?.tenantId, requireTenant: true };
  }

  protected repository: IRepository<T>;

  constructor(repository: IRepository<T>) {
    super();
    this.repository = repository;
  }

  protected getRequestScope(req: Request, requireTenant = true): RepositoryScope | undefined {
    const authData = (req as any).authData;
    if (!authData) {
      return undefined;
    }

    return {
      tenantId: authData.tenantId,
      requireTenant,
    };
  }

  public createItem = async (req: CreateItemRequest<T>, res: Response): Promise<void> => {

    // console.log('CRUDController createItem req.body -->', req.body, req.authData);

    try {
      if (req.file) {
        (req.body as any)['logo'] = buildUploadUrl(req, req.file.filename);
      }
      const payload: any = { ...(req.body as any) };

      if (req.authData?.id) {
        payload.ownerId = new ObjectId(req.authData.id);
        payload.createdBy = new ObjectId(req.authData.id);
      }
      if (req.authData?.tenantId) {
        payload.tenantId = new ObjectId(req.authData.tenantId);
      }
      if ((req as any).authData?.brancheId) {
        payload.brancheId = new ObjectId((req as any).authData.brancheId);
      }

      const scope = this.getRequestScope(req);
      const savedItem = await this.repository.create(payload, scope);
      const totalData = await this.repository.countDocuments({}, scope);
      this.sendResponse(req, res, 201, [savedItem], totalData);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };

  public getAllItems = async (req: Request, res: Response): Promise<void> => {
    try {

      // console.clear();
      // console.log('CRUDController getAllItems filter -->', req.query.Filter);
      const filter = this.parseFilter(req.query.Filter);
      const page = filter['pageNo'] || 1;
      const pageSize = filter['pageSize'] || 10;
      const { items, totalData } = await this.repository.paginate(filter, page, pageSize, this.getRequestScope(req));

      this.sendResponse(req, res, 200, items, totalData);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };

  public getItemById = async (req: Request, res: Response): Promise<void> => {
    try {
      const item = await this.repository.findById(req.params.id, this.getRequestScope(req));
      if (!item) {
        res.status(404).json({ msg: 'Item not found' });
        return;
      }
      this.sendResponse(req, res, 200, [item]);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };

  public updateItem = async (req: Request, res: Response): Promise<void> => {

    // console.log('updateItem -->', req.params.id)
    try {

      // let fileData = {};
      if (req.file) {
        // Construct the full URL for the uploaded file
        // const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        // Get file metadata
        // fileData = await {
        //   originalName: req.file.originalname,
        //   storageName: req.file.filename,
        //   size: req.file.size,
        //   mimeType: req.file.mimetype,
        //   path: req.file.path,
        // };
        req.body['logo'] = buildUploadUrl(req, req.file.filename);
      }

      // console.log('req.body -->', req.rawHeaders);
      // console.log('req.body -->', req.body, fileData);

      (req.body as any)._id = req.params.id;
      const updatedItem = await this.repository.updateById(req.params.id, req.body as any, this.getRequestScope(req));
      if (!updatedItem) {
        res.status(404).json({ msg: 'Item not found' });
        return;
      }
      this.sendResponse(req, res, 200, [updatedItem]);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };

  public updateManyItems = async (req: Request, res: Response): Promise<void> => {

    try {

      // console.log('updateManyItems -->', req.body);

      let ids: string[] = req.body.map((item: any) => item._id);

      const updates = req.body; // Array of updates from the request body

      if (!Array.isArray(updates)) {
        res.status(400).json({ msg: 'Updates should be an array' });
        return;
      }

      const scope = this.getRequestScope(req);
      const updatePromises = updates.map((item) => this.repository.updateById(item._id, { stock: item.stock } as any, scope));

      await Promise.all(updatePromises);
      let updatedItems = await this.repository.find({ _id: { $in: ids } }, { scope });
      this.sendResponse(req, res, 200, updatedItems);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };

  public deleteItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const scope = this.getRequestScope(req);
      const deletedItem = await this.repository.deleteById(req.params.id, scope);
      if (!deletedItem) {
        res.status(404).json({ msg: 'Item not found' });
        return;
      }
      const totalData = await this.repository.countDocuments({}, scope);
      this.sendResponse(req, res, 200, [deletedItem], totalData);
    } catch (err: any) {
      this.sendErrorResponse(req, res, err);
    }
  };

  protected parseFilter(filter: any) {
    try {
      return typeof filter === 'string' ? JSON.parse(filter) : {};
    } catch {
      return {};
    }
  }
}
