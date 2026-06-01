import { Request, Response } from 'express';
// import { CRUDController } from './base/CRUDController';
import { IClient } from '../../types';
import { CRUDController } from '../base/CRUDController';
import { clientRepository } from '../../repositories/instances';

export class ClientController extends CRUDController<IClient> {
  constructor() {
    super(clientRepository);
  }

  checkPhone = async (req: Request, res: Response) => {
    // console.log('checkPhone req.params ---> ', req.params);
    let { phone } = req.params;
    // let { activeState, ...otherFilters } = req.query; // Assuming additional filters are sent via query params
    
    let filter = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : {};
    let {ownerId, brancheId} = filter;
    // console.log('filter---> ', filter);
    // const filter2 = this.parseFilter(req.query.Filter);

    try {
      // Build query object dynamically
      let query: any = { phone: { $regex: phone, $options: 'i' } }; // Regular expression for phone number
          query.activeState = true; // Convert to boolean
          query.brancheId = brancheId;

          Object.assign(query);

      // console.log('checkPhone query ---> ', query);
      // Use regular expression to filter phone numbers that contain the provided string
      let users: IClient[] = await this.repository.find(query);
      // console.log('checkPhone users ---> ', users);

      if (users) {
        res.status(200).json({
          success: true,
          errors: [],
          status: 200,
          message: '',
          data: users 
        });
      } 
    } catch (err: any) {
      // console.log('catch checkPhone error ---> ', err);
      // this.sendErrorResponse(res, err);
      res.status(500).json({
        success: true,
        errors: err,
        status: 500,
        message: 'get clients by phone number error',
        data: []
      });
    }
  };

  getAllItemsPagination = async (req: Request, res: Response) => {
    try {
      let { page = 1, limit = 10, filterBy, filterValue } = req.query;
  
      let filter: any = {};
      // if (filterBy && filterValue) {
      //   filter[filterBy] = { $regex: new RegExp(filterValue, 'i') };
      // }
  
      const pageNo = Number(page) || 1;
      const pageSize = Number(limit) || 10;
      const items = await this.repository.find(filter, {
        skip: (pageNo - 1) * pageSize,
        limit: pageSize,
      });
  
      const totalCount = await this.repository.countDocuments(filter);
  
      res.status(200).json({
        success: true,
        data: {
          items,
          pagination: {
            currentPage: pageNo,
            totalPages: Math.ceil(totalCount / pageSize),
            totalItems: totalCount,
            itemsPerPage: pageSize,
          },
        },
      });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  };

}

