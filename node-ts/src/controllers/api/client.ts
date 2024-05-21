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

// export class ClientController{

//   createItem = async (req: CreateItemRequest<IClient>, res: Response) => {
//     try {
//       let newItem: IClient = new ClientModel(req.body);
  
//       newItem.ownerId = new ObjectId(req.authData.id);
  
//       const savedItem = await newItem.save();
//       res.status(201).json({
//         success: true,
//         errors: [],
//         status: 200,
//         message: '',
//         data: [savedItem],
//       });
//     } catch (err: any) {
//       console.error('err.message -->', err.message);
//       res.status(500).json({
//         success: false,
//         errors: [err.message],
//         status: 500,
//         message: '',
//         data: {},
//       });
//     }
//   };
  
//   getAllItems = async (req: Request, res: Response) => {
  
//     let filter = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : {};
  
//     let { ownerId, brancheId } = filter;
  
//     const pageSize = req.query.PageSize && +req.query.PageSize > 0 ? req.query.PageSize : 15;
//     const pageNo = req.query.PageNo && +req.query.PageNo > 0 ? req.query.PageNo : 1;
//     try {
//       const items = await ClientModel.find({ brancheId }).sort({ createdAt: -1, activeState: 1 });
//       res.status(201).json({
//         success: true,
//         errors: [],
//         status: 200,
//         message: '',
//         data: items,
//       });
//     } catch (err: any) {
//       console.error(err.message);
//       res.status(500).send('Server Error');
//     }
//   };
  
//   getAllItemsPagination = async (req: Request, res: Response) => {
//     try {
//       let { page = 1, limit = 10, filterBy, filterValue } = req.query;
  
//       let filter: any = {};
//       // if (filterBy && filterValue) {
//       //   filter[filterBy] = { $regex: new RegExp(filterValue, 'i') };
//       // }
  
//       const items = await ClientModel.find(filter)
//         .skip((+page - 1) * +limit)
//         .limit(+limit);
  
//       const totalCount = await ClientModel.countDocuments(filter);
  
//       res.status(200).json({
//         success: true,
//         data: {
//           items,
//           pagination: {
//             currentPage: page,
//             totalPages: Math.ceil(totalCount / +limit),
//             totalItems: totalCount,
//             itemsPerPage: limit,
//           },
//         },
//       });
//     } catch (err: any) {
//       console.error(err.message);
//       res.status(500).send('Server Error');
//     }
//   };
  
//   getItemById = async (req: Request, res: Response) => {
//     try {
//       const item = await ClientModel.findById(req.params.id);
//       if (!item) {
//         return res.status(404).json({ msg: 'Item not found' });
//       }
//       res.status(201).json({
//         success: true,
//         errors: [],
//         status: 200,
//         message: '',
//         data: {},
//       });
//     } catch (err: any) {
//       console.error(err.message);
//       res.status(500).send('Server Error');
//     }
//   };
  
//   updateItem = async (req: Request, res: Response) => {
//     try {
//       const updatedItem = await ClientModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
//       if (!updatedItem) {
//         return res.status(404).json({ msg: 'Item not found' });
//       }
//       res.status(201).json({
//         success: true,
//         errors: [],
//         status: 200,
//         message: '',
//         data: [updatedItem],
//       });
//     } catch (err: any) {
//       console.error(err.message);
//       res.status(500).send('Server Error');
//     }
//   };
  
//   deleteItem = async (req: Request, res: Response) => {
//     try {
//       const deletedItem = await ClientModel.findByIdAndDelete(req.params.id);
//       if (!deletedItem) {
//         return res.status(404).json({ msg: 'Item not found' });
//       }
//       res.status(201).json({
//         success: true,
//         errors: [],
//         status: 200,
//         message: '',
//         data: [deletedItem],
//       });
//     } catch (err: any) {
//       console.error(err.message);
//       res.status(500).send('Server Error');
//     }
//   };
// }