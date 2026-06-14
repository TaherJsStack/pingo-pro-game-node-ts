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

    let filter = this.parseFilter(req.query.Filter);
    const brancheId = (req as any).authData?.brancheId;
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
      let users: IClient[] = await this.repository.find(query, { scope: this.getScope(req) });
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

}

