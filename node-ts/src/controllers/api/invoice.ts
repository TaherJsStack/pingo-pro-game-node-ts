import { Types } from 'mongoose';
import { Request, Response } from 'express';
import InvoiceModel from '../../models/invoice';
import InvoiceService from '../../services/invoice.service';
import CategoryModel from '../../models/category';
import PricingModel from '../../models/pricing';
import { IInvoice } from '../../models/interfaces/invoice.interface';
import ClientModel from '../../models/client';
import { SendResponse } from '../base/sendResponse';
import { CRUDController } from '../base/CRUDController';
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
      super(InvoiceModel);
    }


  createNewInvoice = async (req: CreateRequest, res: Response) => {

    const invocesCount = await InvoiceModel.find({"brancheId": req.body.brancheId}).countDocuments();

    req.body['createdBy'] = new Types.ObjectId(req.authData.id);
    req.body.categories[0]['createdBy'] = new ObjectId(req.authData.id);
    req.body.invoiceNo = 20250601 + invocesCount + 1;
    
    try{
      const newInvoice = new InvoiceModel(req.body);
      const savedInvoice = await newInvoice.save();
      await savedInvoice.calculateCategoriesTotal();
      await savedInvoice.calculateMenuItemsTotal();

      // this.sendResponse(req, res, 200, savedInvoice);
      this.sendResponse(req, res, 200, [savedInvoice], savedInvoice.categories.length, 'Invoice created successfully');
      // req: Request, res: Response, statusCode: number, data: any, totalData?: number, message?: string
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

  updateBill = async (req: CreateRequest, res: Response) => {
    let _id = req.params.id
    try {
      // Update item by ID in database
      // req.body['updatedBy'] = new Types.ObjectId(req.authData.id);
      const updatedItem = await InvoiceModel.findByIdAndUpdate(
        _id,
        req.body,
        { new: true }
      );
      if (!updatedItem) {
        return res.status(404).json({ msg: 'Item not found' });
      }
      await updatedItem.calculateCategoriesTotal();
      await updatedItem.calculateMenuItemsTotal();
  
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
      const updateItem = await InvoiceModel.updateOne(
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
      const updatedItem = await InvoiceModel.findById(documentId);
  
      // Ensure additional calculations are done
      if (updatedItem) {
        await updatedItem.calculateCategoriesTotal();
        await updatedItem.calculateMenuItemsTotal();
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
      const update = await InvoiceModel.updateMany(
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

      let updatedItem = await InvoiceModel.findById(_id);
      if (!updatedItem) {
        return res.status(404).json({ msg: 'Item not found' });
      }
      await updatedItem.calculateCategoriesTotal();
      await updatedItem.calculateMenuItemsTotal();

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

  // --------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------  
  async setEndTimeToSessionsList(idsList: SessionsIdsList) {
    console.log('1- idsList ----->', idsList);
    for (const sessionId of idsList.idsToDelete) {
      try {
        const existingInvoice = await InvoiceModel.findOne({ sessionId });
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
  
              const updatedInvoice = await InvoiceModel.findByIdAndUpdate(
                existingInvoice._id,
                updateQuery,
                options
              );
  
              if (updatedInvoice) {
                updatedInvoice.calculateCategoriesTotal();
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
      // Match invoices created by the employee
      const invoices = await InvoiceModel.aggregate([
        {
          $match: { closedBy: new ObjectId(empId) },
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              createdBy: '$createdBy',
            },
            invoices: { $push: '$$ROOT' },
            dailyTotal: { $sum: '$total' },
            createdByCount: { $sum: 1 }, // Count invoices created by this employee
          },
        },
        {
          $sort: { '_id.date': -1 },
        },
      ]);

      // const treeInvoices = await InvoiceModel.aggregate([
      //   // Match only the relevant invoices
      //   {
      //     $match: { closedBy: new ObjectId(empId) },
      //   },
      //   // Add fields for day, week, month, and year
      //   {
      //     $addFields: {
      //       year: { $year: '$createdAt' },
      //       month: { $month: '$createdAt' },
      //       week: { $isoWeek: '$createdAt' },
      //       dayOfWeek: { $dayOfWeek: '$createdAt' }, // 1 (Sunday) to 7 (Saturday)
      //       dayName: {
      //         $arrayElemAt: [
      //           ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      //           { $subtract: ['$dayOfWeek', 1] },
      //         ],
      //       },
      //     },
      //   },
      //   // Group by day
      //   {
      //     $group: {
      //       _id: {
      //         year: '$year',
      //         month: '$month',
      //         week: '$week',
      //         day: '$dayName',
      //       },
      //       invoices: { $push: '$$ROOT' },
      //     },
      //   },
      //   // Group by week
      //   {
      //     $group: {
      //       _id: {
      //         year: '$_id.year',
      //         month: '$_id.month',
      //         week: '$_id.week',
      //       },
      //       days: {
      //         $push: {
      //           dayTitle: '$_id.day',
      //           invoices: '$invoices',
      //         },
      //       },
      //     },
      //   },
      //   // Group by month
      //   {
      //     $group: {
      //       _id: {
      //         year: '$_id.year',
      //         month: '$_id.month',
      //       },
      //       weeks: {
      //         $push: {
      //           weekTitle: { $concat: ['Week ', { $toString: '$_id.week' }] },
      //           days: '$days',
      //         },
      //       },
      //     },
      //   },
      //   // Group by year
      //   {
      //     $group: {
      //       _id: '$_id.year',
      //       months: {
      //         $push: {
      //           monthTitle: {
      //             $arrayElemAt: [
      //               [
      //                 'January', 'February', 'March', 'April', 'May', 'June',
      //                 'July', 'August', 'September', 'October', 'November', 'December',
      //               ],
      //               { $subtract: ['$_id.month', 1] },
      //             ],
      //           },
      //           weeks: '$weeks',
      //         },
      //       },
      //     },
      //   },
      //   // Reshape the final output
      //   {
      //     $project: {
      //       _id: 0,
      //       year: {
      //         yearTitle: '$_id',
      //         months: '$months',
      //       },
      //     },
      //   },
      // ]);
      
      // console.log('2- invoices ----->', treeInvoices);

      const treeInvoices = await InvoiceModel.aggregate([
        // Match only the relevant invoices
        {
          $match: { closedBy: new ObjectId(empId) },
        },
        // Add fields for day, week, month, and year
        {
          $addFields: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            week: { $isoWeek: '$createdAt' },
            dayOfWeek: { $dayOfWeek: '$createdAt' }, // 1 (Sunday) to 7 (Saturday)
            dayName: {
              $arrayElemAt: [
                ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                { $subtract: ['$dayOfWeek', 1] },
              ],
            },
          },
        },
        // Sort by date before grouping
        {
          $sort: { createdAt: -1 },
        },
        // Group by day
        {
          $group: {
            _id: {
              year: '$year',
              month: '$month',
              week: '$week',
              day: '$dayName',
            },
            invoices: { $push: '$$ROOT' },
          },
        },
        // Sort days before grouping by weeks
        {
          $sort: { '_id.day': -1 },
        },
        // Group by week
        {
          $group: {
            _id: {
              year: '$_id.year',
              month: '$_id.month',
              week: '$_id.week',
            },
            days: {
              $push: {
                dayTitle: '$_id.day',
                invoices: '$invoices',
              },
            },
          },
        },
        // Sort weeks before grouping by months
        {
          $sort: { '_id.week': -1 },
        },
        // Group by month
        {
          $group: {
            _id: {
              year: '$_id.year',
              month: '$_id.month',
            },
            weeks: {
              $push: {
                weekTitle: { $concat: ['Week ', { $toString: '$_id.week' }] },
                days: '$days',
              },
            },
          },
        },
        // Sort months before grouping by years
        {
          $sort: { '_id.month': -1 },
        },
        // Group by year
        {
          $group: {
            _id: '$_id.year',
            months: {
              $push: {
                monthTitle: {
                  $arrayElemAt: [
                    [
                      'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December',
                    ],
                    { $subtract: ['$_id.month', 1] },
                  ],
                },
                weeks: '$weeks',
              },
            },
          },
        },
        // Sort years (optional) and reshape the final output
        {
          $sort: { _id: -1 },
        },
        {
          $project: {
            _id: 0,
            year: {
              yearTitle: '$_id',
              months: '$months',
            },
          },
        },
      ]);
      
      const totalInvoices = await InvoiceModel.countDocuments();
      const totalInvoicesClosedBy = await InvoiceModel.countDocuments({ closedBy: new ObjectId(empId) });
      const totalInvoicesCreatedBy = await InvoiceModel.countDocuments({ createdBy: new ObjectId(empId) });
      const sharedDevicesAdded = await InvoiceModel.countDocuments({ 'categories.createdBy': new ObjectId(empId) });
      const sharedDevicesClosed = await InvoiceModel.countDocuments({ 'categories.closedBy': new ObjectId(empId) });
      
      const clientAdded = await ClientModel.countDocuments({ createdBy: new ObjectId(empId) });

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