import { Types } from 'mongoose';
import { Request, Response } from 'express';
import InvoiceService from '../../services/invoice.service';
import { IInvoice } from '../../types';
import { CRUDController } from '../base/CRUDController';
import { clientRepository, invoiceRepository } from '../../repositories/instances';
const { ObjectId } = require('mongoose').Types;

interface CreateRequest extends Request {
  authData: {
    id: string;
  };
  body: IInvoice;
}

interface SessionsIdsList {
  idsToDelete: string[];
  endIn?: string;
}

export class InvoiceController 
// extends SendResponse{

  extends CRUDController<IInvoice> {
    constructor() {
      super(invoiceRepository);
    }


  createNewInvoice = async (req: CreateRequest, res: Response) => {
    try{
      const savedInvoice = await InvoiceService.createNewInvoice(req.body, req.authData.id);
      this.sendResponse(req, res, 200, [savedInvoice], savedInvoice.categories.length, 'Invoice created successfully');
    }catch(err){
      this.sendErrorResponse(req, res, err);
    }
  }

  // Read - GET request handler (Get all items with pagination and filtering)
  getAllItemsPagination = async (req: Request, res: Response) => {
    try {
      let { page = 1, limit = 10, filterBy, filterValue } = req.query;

      // Build filter object based on query parameters
      let filter: any = {};
  
      // Fetch items from database with pagination and filtering
      const pageNo = Number(page) || 1;
      const pageSize = Number(limit) || 10;
      const items = await invoiceRepository.find(filter, {
        skip: (pageNo - 1) * pageSize,
        limit: pageSize,
      });
  
      // Count total number of items (for pagination)
      const totalCount = await invoiceRepository.countDocuments(filter);
  
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

  updateBill = async (req: CreateRequest, res: Response) => {
    let _id = req.params.id
    try {
      // Update item by ID in database
      // req.body['updatedBy'] = new Types.ObjectId(req.authData.id);
      const updatedItem = await invoiceRepository.updateById(_id, req.body as any);
      if (!updatedItem) {
        return res.status(404).json({ msg: 'Item not found' });
      }
      await InvoiceService.syncInvoiceTotals(updatedItem);
  
      res.status(201)
        .json({
          success: true,
          errors: [], 
          status: 200,
          message: '',
          data: [updatedItem],
        });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }

  endDeviceBookStateInInvoice = async (req: CreateRequest, res: Response) => {
    try {
      // console.log('endDeviceBookStateInInvoice ----------> ', req.body);
  
      const documentId = req.params.id;
      const { categories, activeState } = req.body;
  
      // Validate input
      if (!categories || !categories[0]?.categoryId || !categories[0]?.endTime) {
        return res.status(400).json({
          success: false,
          errors: ['Invalid request data.'],
          status: 400,
          message: 'Category ID and End Time are required.',
        });
      }
        
      const categoryId      = categories[0].categoryId;
      const endTime         = categories[0].endTime;
      const closedBy        = req.authData.id;
      const invoiceClosedBy = activeState == false ? req.authData.id : null;

      // const invoiceNo = await InvoiceModel.countDocuments({ activeState: false })+1;

      // Perform update
      const updateItem = await invoiceRepository.updateOne(
        {
          _id: new ObjectId(documentId),
          "categories.categoryId": categoryId,
        },
        {
          $set: {
            "categories.$.endTime":  endTime,
            "categories.$.closedBy": closedBy,
            activeState:  activeState,
            closedBy:     invoiceClosedBy
          },
        }
      );
  
      // Check if update was successful
      if (updateItem.matchedCount === 0) {
        return res.status(404).json({ msg: 'Item not found' });
      }
  
      // Retrieve the updated document
      const updatedItem = await invoiceRepository.findById(documentId);
  
      // Ensure additional calculations are done
      if (updatedItem) {
        await InvoiceService.syncInvoiceTotals(updatedItem);
      }
  
      res.status(200).json({
        success: true,
        errors: [],
        status: 200,
        message: 'Update successful.',
        data: [updatedItem],
      });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).json({
        success: false,
        errors: [err.message],
        status: 500,
        message: 'Server Error',
      });
    }
  };

  // Update - PUT request handler
  updateLockBill = async (req: CreateRequest, res: Response) => {
  
    // menuItems
    let _id = req.params.id
    let closedBy = new Types.ObjectId(req.authData.id);

    //console.log('updateLockBill req.authData ----------------> ', req.authData)
    //console.log('updateLockBill closedBy ----------------> ', closedBy)

    try {
      // Update item by ID in database
      // req.body['closedBy'] = new Types.ObjectId(req.authData.id);
      const update = await invoiceRepository.updateMany(
        { 
          _id: new ObjectId(req.params.id), // Replace with the specific _id
          "categories.endTime": null // Match documents where endTime is null in any category
        }, 
          
        { 
          $set: { 
            "categories.$[elem].endTime": (req.body as any)['endTime'] as string, // Set the endTime to the current timestamp or a specific value
            "categories.$[elem].closedBy": closedBy,
            "activeState": req.body['activeState'], // Set activeState to false
            "closedBy": closedBy,
          }
        },
        { 
          arrayFilters: [{ "elem.endTime": null }], // Filter to target categories with endTime as null
          upsert: false // Ensure it doesn't insert a new document if no match is found
        }
      );

      let updatedItem = await invoiceRepository.findById(_id);
      if (!updatedItem) {
        return res.status(404).json({ msg: 'Item not found' });
      }
      await InvoiceService.syncInvoiceTotals(updatedItem);

      return res.status(201)
        .json({
          success: true,
          errors: [],
          status: 200,
          message: '',
          data: [updatedItem],
      })
    } catch (err: any) {
      console.error(err.message);
      // res.status(500).send('Server Error');
      this.sendErrorResponse(req, res, err);
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
            itemID:   req.body.itemID,
            itemName: req.body.itemName,
            quantity: req.body.quantity,
            price:    req.body.price
          }
        }
      };
  
      // Update item by ID in database
      const updatedItem = await invoiceRepository.updateById(_id, updateQuery as any);
      if (!updatedItem) {
        return res.status(404).json({ msg: 'Item not found' });
      }
      await InvoiceService.syncInvoiceTotals(updatedItem);
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

  // --------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------  
  async setEndTimeToSessionsList(idsList: SessionsIdsList) {
    console.log('1- idsList ----->', idsList);
    for (const sessionId of idsList.idsToDelete) {
      try {
        const existingInvoice = await invoiceRepository.findOne({ sessionId });
        console.log('2- existingInvoice ----->', existingInvoice);
  
        if (existingInvoice) {
        console.log('3- existingInvoice ----->', existingInvoice);

          for (const category of existingInvoice.categories) {
            console.log('4- category ----->', category);

            if (category.endTime === undefined) {
              console.log('5- category.endIn ----->', category.endTime);

              const updateQuery = {
                $set: {
                  'categories.$[elem].endIn': idsList.endIn ?? '',
                }
              };
              const options = {
                new: true,
                arrayFilters: [{ 'elem.sessionId': sessionId }]
              };
  
              await invoiceRepository.updateOne({ _id: existingInvoice._id }, updateQuery as any, options as any);
              const updatedInvoice = await invoiceRepository.findById(existingInvoice._id.toString());
  
              if (updatedInvoice) {
                await InvoiceService.syncInvoiceTotals(updatedInvoice);
              } else {
                console.error('Failed to update invoice. Updated document is null.');
                throw new Error('Failed to update invoice. Updated document is null.');
              }
            }
          }
        } else {
          throw new Error('Invoice not found. Cannot update category data.');
        }
      } catch (error) {
        console.error('Error updating invoice:', error);
        throw new Error('Error updating invoice.');
      }
    }
  }
  
  // --------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------
  getInvoicesByEmployeeWithCountsasync = async (req: Request, res: Response) => {
    let empId = req.params.id

    try {
      const {
        invoices,
        treeInvoices,
        totalInvoices,
        totalInvoicesClosedBy,
        totalInvoicesCreatedBy,
        sharedDevicesAdded,
        sharedDevicesClosed,
      } = await InvoiceService.getInvoicesByEmployeeWithCounts(empId);

      const clientAdded = await clientRepository.countDocuments({ createdBy: new ObjectId(empId) });

      let percentages = {};
      // Ensure totalInvoices is not zero
      if (totalInvoices > 0) {
        percentages = {
          totalInvoicesClosedBy: (totalInvoicesClosedBy / totalInvoices) * 100,
          totalInvoicesCreatedBy: (totalInvoicesCreatedBy / totalInvoices) * 100,
          sharedDevicesAdded: (sharedDevicesAdded / totalInvoices) * 100,
          sharedDevicesClosed: (sharedDevicesClosed / totalInvoices) * 100,
        };
      }

      res.status(201)
      .json({
        success: true,
        errors: [], 
        status: 200,
        message: '',
        data: {
          invoices, 
          treeInvoices,
          totalInvoices,
          percentages,
          clientAdded
        },
      });
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }


}

