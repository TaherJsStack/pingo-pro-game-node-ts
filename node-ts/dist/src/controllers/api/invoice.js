"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceController = void 0;
const mongoose_1 = require("mongoose");
const invoice_1 = __importDefault(require("../../models/invoice"));
const sendResponse_1 = require("../base/sendResponse");
const { ObjectId } = require('mongoose').Types;
// let subscription: any = null;
// (async () => {
//   // await InvoiceService.init();
//   subscription = await InvoiceService.getDataObservable().subscribe(async (data: any) => {
//     switch (data.setDataTyep) {
//       case 'create':
//         // createNewSession(data);
//         break;
//       case 'update':
//         updateSession(data);
//         break;
//       case 'end':
//         // deletedSession(data);
//         break;
//       case 'endList':
//         // deletedListSession(data);
//         break;
//       default:
//         throw new Error('Invalid setDataTyep');
//     }
//   });
// })();
// async function updateSession(data: any) {
//   let _id: string = data.updatedItem.categoryId;
//   let clientId: string = data.updatedItem.clientId;
//   let brancheId: string = data.updatedItem.brancheId;
//   let category: any = await CategoryModel.findOne({ _id });
//   let priceValue: any = await PricingModel.findOne({ _id: new Types.ObjectId(category.priceId) });
//   let existingInvoice: any = await InvoiceModel.findOne({ clientId, brancheId, activeState: true });
//   if (existingInvoice) {
//     const updateQuery = {
//       $set: {
//         // 'categories.$[elem].times': data.updatedItem.times,
//         'categories.$[elem].endIn': data.updatedItem.endIn ? data.updatedItem.endIn : '',
//         'categories.$[elem].price': priceValue.price // Assuming price is available in the category object
//       }
//     };
//     const options = {
//       new: true, // To return the updated document
//       arrayFilters: [{ 'elem.category': { $eq: data.updatedItem.categoryId } }]
//     };
//     // Perform the update operation
//     const updatedInvoice: any = await InvoiceModel.findByIdAndUpdate(
//       existingInvoice._id,
//       updateQuery,
//       options
//     );
//     if (updatedInvoice) {
//       // console.log('Invoice updated with new category data:', updatedInvoice);
//       updatedInvoice.calculateCategoriesTotal()
//     } else {
//       // console.error('Failed to update invoice. Updated document is null.');
//     }
//     if (subscription) {
//       // subscription.unsubscribe();
//     }
//     return
//   } else {
//     // console.log('Invoice not found. Cannot update category data.');
//     if (subscription) {
//       // subscription.unsubscribe();
//     }
//     throw new Error('Invoice not found. Cannot update category data.');
//   }
// }
// async function deletedSession(data: any) {
//   // console.log('deletedSession', data);
//   let _id: string = data.deletedItem.categoryId;
//   let clientId: string = data.deletedItem.clientId;
//   let brancheId: string = data.deletedItem.brancheId;
//   let category: any = await CategoryModel.findOne({ _id });
//   let priceValue: any = await PricingModel.findOne({ _id: new Types.ObjectId(category.priceId) });
//   let existingInvoice: any = await InvoiceModel.findOne({ clientId, brancheId, activeState: true });
//   if (existingInvoice) {
//     const updateQuery = {
//       $set: {
//         // 'categories.$[elem].times': data.deletedItem.times,
//         'categories.$[elem].endIn': data.endIn ? data.endIn : '',
//         'categories.$[elem].price': priceValue.price // Assuming price is available in the category object
//       }
//     };
//     const options = {
//       new: true, // To return the updated document
//       arrayFilters: [{ 'elem.category': { $eq: data.deletedItem.categoryId } }]
//     };
//     // Perform the update operation
//     const updatedInvoice: any = await InvoiceModel.findByIdAndUpdate(
//       existingInvoice._id,
//       updateQuery,
//       options
//     );
//     if (updatedInvoice) {
//       // console.log('Invoice updated with new category data:', updatedInvoice);
//       updatedInvoice.calculateCategoriesTotal();
//     } else {
//       // console.error('Failed to update invoice. Updated document is null.');
//     }
//     if (subscription) {
//       // subscription.unsubscribe();
//     }
//     return
//   } else {
//     // console.log('Invoice not found. Cannot update category data.');
//     if (subscription) {
//       // subscription.unsubscribe();
//     }
//     throw new Error('Invoice not found. Cannot update category data.');
//   }
// }
// async function deletedListSession(data: any) {
//   // console.log('deletedListSession data', data);
//   // console.log('deletedListSession idsToDelete', data.idsToDelete);
//   // let _id             = data.deletedItem.categoryId;
//   // let clientId        = data.deletedItem.clientId;
//   // let brancheId       = data.deletedItem.brancheId;
//   // let category        = await CategoryModel.findOne({ _id });
//   // let priceValue      = await PricingModel.findOne({ _id: new ObjectId(category.priceId) });
//   for (let index = 0; index < data.idsToDelete.length; index++) {
//     const sessionIdToDelete = data.idsToDelete[index];
//     let existingInvoice: any = await InvoiceModel.findOne({ sessionId: data.idsToDelete[0] });
//     // console.log('deletedListSession', existingInvoice.categories[index].endIn);
//     if (existingInvoice) {
//       if (existingInvoice.categories[index].endIn == undefined) {
//         const updateQuery = {
//           $set: {
//             'categories.$[elem].endIn': data.endIn ? data.endIn : '',
//           }
//         };
//         const options = {
//           new: true, // To return the updated document
//           arrayFilters: [{ 'elem.sessionId': sessionIdToDelete }]
//         };
//         try {
//           // Perform the update operation
//           const updatedInvoice: any = await InvoiceModel.findByIdAndUpdate(
//             existingInvoice._id,
//             updateQuery,
//             options
//           );
//           if (updatedInvoice) {
//             // console.log('Invoice updated with new category data:', updatedInvoice);
//             updatedInvoice.calculateCategoriesTotal();
//           } else {
//             console.error('Failed to update invoice. Updated document is null.');
//           }
//         } catch (error) {
//           console.error('Error updating invoice:', error);
//           throw new Error('Error updating invoice.');
//         }
//       }
//     } else {
//       // console.log('Invoice not found for sessionId:', sessionIdToDelete);
//       throw new Error('Invoice not found. Cannot update category data.');
//     }
//   }
// }
class InvoiceController extends sendResponse_1.SendResponse {
    constructor() {
        super(...arguments);
        this.createNewInvoice = async (req, res) => {
            req.body['createdBy'] = new mongoose_1.Types.ObjectId(req.authData.id);
            try {
                const newInvoice = new invoice_1.default(req.body);
                const savedInvoice = await newInvoice.save();
                await savedInvoice.calculateCategoriesTotal();
                // this.sendResponse(req, res, 200, savedInvoice);
                this.sendResponse(req, res, 200, [savedInvoice], savedInvoice.categories.length, 'Invoice created successfully');
                // req: Request, res: Response, statusCode: number, data: any, totalData?: number, message?: string
            }
            catch (err) {
                this.sendErrorResponse(req, res, err);
            }
        };
        // Read - GET request handler (Get all items)
        this.getAllItems = async (req, res) => {
            let filtersObject = {};
            // let filter: any = JSON.parse(req.query.Filter);
            let filter = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : {};
            let { ownerId, brancheId, activeState } = filter;
            const totalData = await invoice_1.default.find({ brancheId }).countDocuments();
            filtersObject.brancheId = brancheId;
            // filter.activeState ? filtersObject.activeState = activeState : '';
            // Check if activeState is defined and not null
            if (activeState !== undefined && activeState !== null) {
                filtersObject.activeState = activeState;
            }
            // const pageSize: number = req.query.PageSize && +req.query.PageSize > 0 ? req.query.PageSize : 15;
            // const pageNo: number = req.query.PageNo && +req.query.PageNo > 0 ? req.query.PageNo : 1;
            try {
                // Fetch all items from database
                const items = await invoice_1.default.find(filtersObject).sort({ createdAt: -1 });
                res.status(201)
                    .json({
                    success: true,
                    errors: [],
                    status: 200,
                    message: 'Invoices fetched successfully',
                    data: items,
                    totalData
                });
            }
            catch (err) {
                console.error(err.message);
                res.status(500).send('Server Error');
            }
        };
        // Read - GET request handler (Get all items with pagination and filtering)
        this.getAllItemsPagination = async (req, res) => {
            try {
                let { page = 1, limit = 10, filterBy, filterValue } = req.query;
                // page = +page;
                // limit = +limit;
                // Build filter object based on query parameters
                let filter = {};
                // if (filterBy && filterValue) {
                //   filter[filterBy] = { $regex: new RegExp(filterValue, 'i') }; // Case-insensitive regex search
                // }
                // Fetch items from database with pagination and filtering
                const items = await invoice_1.default.find(filter)
                    .skip((+page - 1) * +limit)
                    .limit(+limit);
                // Count total number of items (for pagination)
                const totalCount = await invoice_1.default.countDocuments(filter);
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
            }
            catch (err) {
                console.error(err.message);
                res.status(500).send('Server Error');
            }
        };
        // Read - GET request handler (Get item by ID)
        this.getItemById = async (req, res) => {
            try {
                // Fetch item by ID from database
                const item = await invoice_1.default.findById(req.params.id);
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
            }
            catch (err) {
                console.error(err.message);
                res.status(500).send('Server Error');
            }
        };
        this.updateBill = async (req, res) => {
            let _id = req.params.id;
            try {
                // Update item by ID in database
                // req.body['updatedBy'] = new Types.ObjectId(req.authData.id);
                const updatedItem = await invoice_1.default.findByIdAndUpdate(_id, req.body, { new: true });
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
            }
            catch (err) {
                console.error(err.message);
                res.status(500).send('Server Error');
            }
        };
        this.endDeviceBookStateInInvoice = async (req, res) => {
            try {
                console.log('endDeviceBookStateInInvoice ----------> ', req.body);
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
                const categoryId = categories[0].categoryId;
                const endTime = categories[0].endTime;
                // Perform update
                const updateItem = await invoice_1.default.updateOne({
                    _id: new ObjectId(documentId),
                    "categories.categoryId": categoryId,
                }, {
                    $set: {
                        "categories.$.endTime": endTime,
                        activeState: activeState,
                    },
                });
                // Check if update was successful
                if (updateItem.matchedCount === 0) {
                    return res.status(404).json({ msg: 'Item not found' });
                }
                // Retrieve the updated document
                const updatedItem = await invoice_1.default.findById(documentId);
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
            }
            catch (err) {
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
        this.updateLockBill = async (req, res) => {
            // menuItems
            let _id = req.params.id;
            try {
                // Update item by ID in database
                req.body['closedBy'] = new mongoose_1.Types.ObjectId(req.authData.id);
                const updatedItem = await invoice_1.default.findByIdAndUpdate(_id, req.body, { new: true });
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
            }
            catch (err) {
                console.error(err.message);
                // res.status(500).send('Server Error');
                this.sendErrorResponse(req, res, err);
            }
        };
        // Update - PUT request handler
        this.updateItemMenuItems = async (req, res) => {
            // menuItems
            let _id = req.params.id;
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
                const updatedItem = await invoice_1.default.findByIdAndUpdate(_id, updateQuery, { new: true });
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
            }
            catch (err) {
                console.error(err.message);
                res.status(500).send('Server Error');
            }
        };
        // Update - PUT request handler
        this.updateItem = async (req, res) => {
            // menuItems
            let _id = req.params.id;
            try {
                // Update item by ID in database
                const updatedItem = await invoice_1.default.findByIdAndUpdate(_id, req.body, { new: true });
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
            }
            catch (err) {
                console.error(err.message);
                res.status(500).send('Server Error');
            }
        };
        // Delete - DELETE request handler
        this.deleteItem = async (req, res) => {
            try {
                // Delete item by ID from database
                const deletedItem = await invoice_1.default.findByIdAndDelete(req.params.id);
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
            }
            catch (err) {
                console.error(err.message);
                res.status(500).send('Server Error');
            }
        };
        // updateEndTimeToSessionsList2 = async (req: Request, res: Response) => {
        //   // console.log('1- idsList ----->', req.params.id);
        //   try {
        //     const existingInvoice = await InvoiceModel.findById(req.params.id);
        //     if (!existingInvoice) {
        //       return this.sendErrorResponse(req, res, 'Invoice not found');
        //       // return res.status(404).json({ msg: 'invoice not found' });
        //     }
        //     // console.log('2- existingInvoice ----->', existingInvoice);
        //     for (const category of existingInvoice.categories) {
        //       // console.log('4- category ----->', category);
        //       if (category.startTime === undefined) {
        //         // console.log('5- category.endIn ----->', category.endIn);
        //         const updateQuery = {
        //           $set: {
        //             'categories.$[elem].endIn': new Date().toISOString(),
        //           }
        //         };
        //         const options = {
        //           new: true,
        //           arrayFilters: [{ 'elem.sessionId': new ObjectId(category.sessionId) }]
        //         };
        //         const updatedInvoice = await InvoiceModel.findByIdAndUpdate(
        //           new ObjectId(existingInvoice._id),
        //           updateQuery,
        //           options
        //         );
        //         if (updatedInvoice) {
        //           // console.log('6- updatedInvoice ----->', updatedInvoice);
        //           updatedInvoice.calculateCategoriesTotal();
        //           this.sendResponse(req,res, 200, updatedInvoice);
        //         } else {
        //           console.error('Failed to update invoice. Updated document is null.');
        //           // throw new Error('Failed to update invoice. Updated document is null.');
        //           this.sendErrorResponse(req, res, 'Failed to update invoice. Updated document is null.');
        //         }
        //       }
        //     }
        //   } catch (error) {
        //   }
        // }
        // --------------------------------------------------------------------------------------------------
        // --------------------------------------------------------------------------------------------------
        // --------------------------------------------------------------------------------------------------
        // async setEndTimeToSessionsList(idsList: SessionsIdsList) {
        //   console.log('1- idsList ----->', idsList);
        //   for (const sessionId of idsList.idsToDelete) {
        //     try {
        //       const existingInvoice = await InvoiceModel.findOne({ sessionId });
        //       console.log('2- existingInvoice ----->', existingInvoice);
        //       if (existingInvoice) {
        //       console.log('3- existingInvoice ----->', existingInvoice);
        //         for (const category of existingInvoice.categories) {
        //           console.log('4- category ----->', category);
        //           if (category.endIn === undefined) {
        //             console.log('5- category.endIn ----->', category.endIn);
        //             const updateQuery = {
        //               $set: {
        //                 'categories.$[elem].endIn': idsList.endIn ?? '',
        //               }
        //             };
        //             const options = {
        //               new: true,
        //               arrayFilters: [{ 'elem.sessionId': sessionId }]
        //             };
        //             const updatedInvoice = await InvoiceModel.findByIdAndUpdate(
        //               existingInvoice._id,
        //               updateQuery,
        //               options
        //             );
        //             if (updatedInvoice) {
        //               console.log('6- updatedInvoice ----->', updatedInvoice);
        //               updatedInvoice.calculateCategoriesTotal();
        //             } else {
        //               console.error('Failed to update invoice. Updated document is null.');
        //               throw new Error('Failed to update invoice. Updated document is null.');
        //             }
        //           }
        //         }
        //       } else {
        //         throw new Error('Invoice not found. Cannot update category data.');
        //       }
        //     } catch (error) {
        //       console.error('Error updating invoice:', error);
        //       throw new Error('Error updating invoice.');
        //     }
        //   }
        // }
    }
}
exports.InvoiceController = InvoiceController;
