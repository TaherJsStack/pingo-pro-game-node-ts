import { Types } from 'mongoose';
import { Request, Response } from 'express';
import InvoiceModel, { IInvoice } from '../../models/invoice';
import InvoiceService from '../../services/invoice.service';
import CategoryModel from '../../models/category';
import PricingModel from '../../models/pricing';

interface CreateRequest extends Request {
  authData: {
    id: string;
  };
  body: IInvoice;
}

let subscription: any = null;
(async () => {
  // await InvoiceService.init();
  subscription = await InvoiceService.getDataObservable().subscribe(async (data: any) => {

    switch (data.setDataTyep) {
      case 'create':
        createNewSession(data);
        break;
      case 'update':
        updateSession(data);
        break;
      case 'end':
        deletedSession(data);
        break;
      case 'endList':
        deletedListSession(data);
        break;
      default:
        throw new Error('Invalid setDataTyep');
    }

  });


})();

async function createNewSession(data: any) {
  let _id: string = data.savedItem.categoryId;
  let clientId: string = data.savedItem.clientId;
  let brancheId: string = data.savedItem.brancheId;
  let category: any = await CategoryModel.findOne({ _id });
  let priceValue: any = await PricingModel.findOne({ _id: new Types.ObjectId(category.priceId) });
  let existingInvoice: any = await InvoiceModel.findOne({ clientId, brancheId, activeState: true });

  if (existingInvoice) {

    const updateQuery = {
      $push: {
        categories: {
          category: data.savedItem.categoryId,
          sessionId: data.savedItem._id,
          // times:    data.savedItem.times,
          price: priceValue.price,
          startIn: data.savedItem.startTime,
        }
      }
    };
    // Perform the update operation
    const updatedInvoice: any = await InvoiceModel.findByIdAndUpdate(
      existingInvoice._id,
      updateQuery,
      { new: true } // To return the updated document
    );
    await updatedInvoice.calculateCategoriesTotal();

    return
  } else {
    // add new item
    try {
      // Create new item using Invoice Service
      let Obj = {
        sessionId: data.savedItem._id,
        // createdBy: data.savedItem.ownerId,
        brancheId: data.savedItem.brancheId,
        categoryId: data.savedItem.categoryId,
        clientId: data.savedItem.clientId,
        description: data.savedItem.description,
        createdBy: data.savedItem.createdBy,
        categories: [
          {
            category: data.savedItem.categoryId,
            sessionId: data.savedItem._id,
            // times:     data.savedItem.times,
            price: priceValue.price,
            startIn: data.savedItem.startTime,
          }],
      }
      let newItem = new InvoiceModel(Obj);
      // Save item to database
      const savedItem = await newItem.save();
      await savedItem.calculateCategoriesTotal();
    } catch (err: any) {
      console.error('createNewSession err.message -->', err.message);
    }
  }

  if (subscription) {
    // subscription.unsubscribe();
  }
}

async function updateSession(data: any) {
  let _id: string = data.updatedItem.categoryId;
  let clientId: string = data.updatedItem.clientId;
  let brancheId: string = data.updatedItem.brancheId;
  let category: any = await CategoryModel.findOne({ _id });
  let priceValue: any = await PricingModel.findOne({ _id: new Types.ObjectId(category.priceId) });
  let existingInvoice: any = await InvoiceModel.findOne({ clientId, brancheId, activeState: true });

  if (existingInvoice) {

    const updateQuery = {
      $set: {
        // 'categories.$[elem].times': data.updatedItem.times,
        'categories.$[elem].endIn': data.updatedItem.endIn ? data.updatedItem.endIn : '',
        'categories.$[elem].price': priceValue.price // Assuming price is available in the category object
      }
    };

    const options = {
      new: true, // To return the updated document
      arrayFilters: [{ 'elem.category': { $eq: data.updatedItem.categoryId } }]
    };

    // Perform the update operation
    const updatedInvoice: any = await InvoiceModel.findByIdAndUpdate(
      existingInvoice._id,
      updateQuery,
      options
    );

    if (updatedInvoice) {
      console.log('Invoice updated with new category data:', updatedInvoice);
      updatedInvoice.calculateCategoriesTotal()

    } else {
      console.error('Failed to update invoice. Updated document is null.');
    }
    if (subscription) {
      // subscription.unsubscribe();
    }
    return
  } else {
    console.log('Invoice not found. Cannot update category data.');
    if (subscription) {
      // subscription.unsubscribe();
    }
    throw new Error('Invoice not found. Cannot update category data.');
  }


}

async function deletedSession(data: any) {
  console.log('deletedSession', data);
  let _id: string = data.deletedItem.categoryId;
  let clientId: string = data.deletedItem.clientId;
  let brancheId: string = data.deletedItem.brancheId;
  let category: any = await CategoryModel.findOne({ _id });
  let priceValue: any = await PricingModel.findOne({ _id: new Types.ObjectId(category.priceId) });
  let existingInvoice: any = await InvoiceModel.findOne({ clientId, brancheId, activeState: true });

  if (existingInvoice) {

    const updateQuery = {
      $set: {
        // 'categories.$[elem].times': data.deletedItem.times,
        'categories.$[elem].endIn': data.endIn ? data.endIn : '',
        'categories.$[elem].price': priceValue.price // Assuming price is available in the category object
      }
    };

    const options = {
      new: true, // To return the updated document
      arrayFilters: [{ 'elem.category': { $eq: data.deletedItem.categoryId } }]
    };

    // Perform the update operation
    const updatedInvoice: any = await InvoiceModel.findByIdAndUpdate(
      existingInvoice._id,
      updateQuery,
      options
    );

    if (updatedInvoice) {
      console.log('Invoice updated with new category data:', updatedInvoice);
      updatedInvoice.calculateCategoriesTotal();

    } else {
      console.error('Failed to update invoice. Updated document is null.');
    }
    if (subscription) {
      // subscription.unsubscribe();
    }
    return
  } else {
    console.log('Invoice not found. Cannot update category data.');
    if (subscription) {
      // subscription.unsubscribe();
    }
    throw new Error('Invoice not found. Cannot update category data.');
  }


}

async function deletedListSession(data: any) {
  console.log('deletedListSession data', data);
  console.log('deletedListSession idsToDelete', data.idsToDelete);

  // let _id             = data.deletedItem.categoryId;
  // let clientId        = data.deletedItem.clientId;
  // let brancheId       = data.deletedItem.brancheId;
  // let category        = await CategoryModel.findOne({ _id });
  // let priceValue      = await PricingModel.findOne({ _id: new ObjectId(category.priceId) });


  for (let index = 0; index < data.idsToDelete.length; index++) {
    const sessionIdToDelete = data.idsToDelete[index];
    let existingInvoice: any = await InvoiceModel.findOne({ sessionId: data.idsToDelete[0] });

    console.log('deletedListSession', existingInvoice.categories[index].endIn);

    if (existingInvoice) {

      if (existingInvoice.categories[index].endIn == undefined) {
        const updateQuery = {
          $set: {
            'categories.$[elem].endIn': data.endIn ? data.endIn : '',
          }
        };
        const options = {
          new: true, // To return the updated document
          arrayFilters: [{ 'elem.sessionId': sessionIdToDelete }]
        };

        try {
          // Perform the update operation
          const updatedInvoice: any = await InvoiceModel.findByIdAndUpdate(
            existingInvoice._id,
            updateQuery,
            options
          );

          if (updatedInvoice) {
            console.log('Invoice updated with new category data:', updatedInvoice);
            updatedInvoice.calculateCategoriesTotal();
          } else {
            console.error('Failed to update invoice. Updated document is null.');
          }
        } catch (error) {
          console.error('Error updating invoice:', error);
          throw new Error('Error updating invoice.');
        }

      }

    } else {
      console.log('Invoice not found for sessionId:', sessionIdToDelete);
      throw new Error('Invoice not found. Cannot update category data.');
    }

  }


}

export class InvoiceController{
  
  // Read - GET request handler (Get all items)
  getAllItems = async (req: Request, res: Response) => {
  
    // let filter: any = JSON.parse(req.query.Filter);
    let filter = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : {};
  
    let { ownerId, brancheId } = filter;
  
    // const pageSize: number = req.query.PageSize && +req.query.PageSize > 0 ? req.query.PageSize : 15;
    // const pageNo: number = req.query.PageNo && +req.query.PageNo > 0 ? req.query.PageNo : 1;
  
    try {
      // Fetch all items from database
      const items = await InvoiceModel.find({ brancheId }).sort({ activeState: -1, createdAt: -1 });
      res.status(201)
        .json({
          success: true,
          errors: [],
          status: 200,
          message: '',
          data: items
        });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  };
  
  // Read - GET request handler (Get all items with pagination and filtering)
  getAllItemsPagination = async (req: Request, res: Response) => {
    try {
      let { page = 1, limit = 10, filterBy, filterValue } = req.query;
      // page = +page;
      // limit = +limit;
  
      // Build filter object based on query parameters
      let filter: any = {};
      // if (filterBy && filterValue) {
      //   filter[filterBy] = { $regex: new RegExp(filterValue, 'i') }; // Case-insensitive regex search
      // }
  
      // Fetch items from database with pagination and filtering
      const items = await InvoiceModel.find(filter)
        .skip((+page - 1) * +limit)
        .limit(+limit);
  
      // Count total number of items (for pagination)
      const totalCount = await InvoiceModel.countDocuments(filter);
  
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
  
  // Read - GET request handler (Get item by ID)
  getItemById = async (req: Request, res: Response) => {
    try {
      // Fetch item by ID from database
      const item = await InvoiceModel.findById(req.params.id);
      if (!item) {
        return res.status(404).json({ msg: 'Item not found' });
      }
      res.status(201)
        .json({
          success: true,
          errors: [],
          status: 200,
          message: '',
          data: {}
        });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  };
  
  // Update - PUT request handler
  updateLockBill = async (req: CreateRequest, res: Response) => {
  
    // menuItems
    let _id = req.params.id
    try {
      // Update item by ID in database
      req.body['closedBy'] = new Types.ObjectId(req.authData.id);
      const updatedItem = await InvoiceModel.findByIdAndUpdate(
        _id,
        req.body,
        { new: true }
      );
      if (!updatedItem) {
        return res.status(404).json({ msg: 'Item not found' });
      }
      await updatedItem.calculateCategoriesTotal();
  
      res.status(201)
        .json({
          success: true,
          errors: [],
          status: 200,
          message: '',
          data: [updatedItem]
        });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  };
  
  // Update - PUT request handler
  updateItemMenuItems = async (req: Request, res: Response) => {
  
    // menuItems
    let _id = req.params.id
    try {
  
      const updateQuery = {
        $push: {
          menuItems: {
            itemID: req.body.itemID,
            itemName: req.body.itemName,
            quantity: req.body.quantity,
            price: req.body.price
          }
        }
      };
  
      // Update item by ID in database
      const updatedItem = await InvoiceModel.findByIdAndUpdate(
        _id,
        updateQuery,
        { new: true }
      );
      if (!updatedItem) {
        return res.status(404).json({ msg: 'Item not found' });
      }
      await updatedItem.calculateMenuItemsTotal();
      // await updatedItem.calculateCategoriesTotal();
      res.status(201)
        .json({
          success: true,
          errors: [],
          status: 200,
          message: '',
          data: [updatedItem]
        });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  };
  
  
  // Update - PUT request handler
  updateItem = async (req: Request, res: Response) => {
  
    // menuItems
    let _id = req.params.id
    try {
      // Update item by ID in database
      const updatedItem = await InvoiceModel.findByIdAndUpdate(
        _id,
        req.body,
        { new: true }
      );
      if (!updatedItem) {
        return res.status(404).json({ msg: 'Item not found' });
      }
      res.status(201)
        .json({
          success: true,
          errors: [],
          status: 200,
          message: '',
          data: [updatedItem]
        });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  };
  
  // Delete - DELETE request handler
  deleteItem = async (req: Request, res: Response) => {
    try {
      // Delete item by ID from database
      const deletedItem = await InvoiceModel.findByIdAndDelete(req.params.id);
      if (!deletedItem) {
        return res.status(404).json({ msg: 'Item not found' });
      }
      res.status(201)
        .json({
          success: true,
          errors: [],
          status: 200,
          message: '',
          data: {}
        });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  };
}