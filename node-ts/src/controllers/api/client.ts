import { Request, Response } from 'express';
import ClientModel from '../../models/client';
import { CRUDController } from './base/CRUDController';
import { IClient } from '../../models/interfaces/client.interface';


export class ClientController extends CRUDController<IClient> {
  constructor() {
    super(ClientModel);
  }

  getAllItemsPagination = async (req: Request, res: Response) => {
    try {
      let { page = 1, limit = 10, filterBy, filterValue } = req.query;
  
      let filter: any = {};
      // if (filterBy && filterValue) {
      //   filter[filterBy] = { $regex: new RegExp(filterValue, 'i') };
      // }
  
      const items = await ClientModel.find(filter)
        .skip((+page - 1) * +limit)
        .limit(+limit);
  
      const totalCount = await ClientModel.countDocuments(filter);
  
      res.status(200).json({
        success: true,
        data: {
          items,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / +limit),
            totalItems: totalCount,
            itemsPerPage: limit,
          },
        },
      });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  };
  

}
