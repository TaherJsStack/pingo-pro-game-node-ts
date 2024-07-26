"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceMenuController = void 0;
const invoice_menu_1 = __importDefault(require("../../models/invoice-menu"));
const CRUDController_1 = require("../base/CRUDController");
const { ObjectId } = require('mongoose').Types;
class InvoiceMenuController extends CRUDController_1.CRUDController {
    constructor() {
        super(invoice_menu_1.default);
        // Create - POST request handler
        this.createItem = async (req, res) => {
            try {
                // Create new item using request body
                const newItem = new invoice_menu_1.default(req.body);
                newItem.createdBy = new ObjectId(req.authData.id);
                // Save item to database
                const savedItem = await newItem.save();
                newItem.updateTotal()
                    .then(total => {
                    // console.log('Updated total:', total);
                })
                    .catch(error => {
                    // console.error('Error updating total:', error);
                });
                res.status(201)
                    .json({
                    success: true,
                    errors: [],
                    status: 200,
                    message: '',
                    data: [savedItem]
                });
            }
            catch (err) {
                console.error('err.message -->', err.message);
                res.status(500)
                    .json({
                    success: false,
                    errors: [err.message],
                    status: 500,
                    message: '',
                    data: {}
                });
                // .send('Server Error');
            }
        };
        // Read - GET request handler (Get all items)
        // getAllItems = async (req: Request, res: Response): Promise<void> => {
        //   // let filter = JSON.parse(req.query.Filter);
        //   let filter = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : {};
        //   let {ownerId, brancheId} = filter;
        //   const pageSize = req.query.PageSize && +req.query.PageSize > 0 ? req.query.PageSize : 15;
        //   const pageNo   = req.query.PageNo && +req.query.PageNo > 0 ? req.query.PageNo : 1 ;
        //   try {
        //     // Fetch all items from database
        //     const items = await InvoiceMenuModel.find({ brancheId}).sort({ type: -1, activeState: -1, createdAt: -1 });
        //     res.status(201)
        //     .json({
        //       success: true,
        //       errors: [],
        //       status: 200,
        //       message:  '',
        //       data: items
        //   });
        //   } catch (err: any) {
        //     console.error(err.message);
        //     res.status(500).send('Server Error');
        //   }
        // };
        // Read - GET request handler (Get all items with pagination and filtering)
        // getAllItemsPagination = async (req: Request, res: Response): Promise<void> => {
        //   try {
        //     let { page = 1, limit = 10, filterBy, filterValue } = req.query;
        //     // Build filter object based on query parameters
        //     let filter = {};
        //     // if (filterBy && filterValue) {
        //     //   filter[filterBy] = { $regex: new RegExp(filterValue, 'i') }; // Case-insensitive regex search
        //     // }
        //     // Fetch items from database with pagination and filtering
        //     const items = await InvoiceMenuModel.find(filter)
        //       .skip((+page - 1) * +limit)
        //       .limit(+limit);
        //     // Count total number of items (for pagination)
        //     const totalCount = await InvoiceMenuModel.countDocuments(filter);
        //     res.status(200).json({
        //       success: true,
        //       data: {
        //         items,
        //         pagination: {
        //           currentPage: page,
        //           totalPages: Math.ceil(totalCount / +limit),
        //           totalItems: totalCount,
        //           itemsPerPage: limit,
        //         },
        //       },
        //     });
        //   } catch (err: any) {
        //     console.error(err.message);
        //     res.status(500).send('Server Error');
        //   }
        // };
        // Read - GET request handler (Get item by ID)
        // getItemById = async (req: Request, res: Response): Promise<void> => {
        //   try {
        //     // Fetch item by ID from database
        //     const item = await InvoiceMenuModel.findById(req.params.id);
        //     if (!item) {
        //       res.status(404).json({ msg: 'Item not found' });
        //     }
        //     res.status(201)
        //         .json({
        //           success: true,
        //           errors: [],
        //           status: 200,
        //           message:  '',
        //           data: {}
        //       });
        //   } catch (err: any) {
        //     console.error(err.message);
        //     res.status(500).send('Server Error');
        //   }
        // };
        // Update - PUT request handler
        // updateItem = async (req: Request, res: Response): Promise<void> => {
        //   try {
        //     // Update item by ID in database
        //     const updatedItem = await InvoiceMenuModel.findByIdAndUpdate(
        //       req.params.id,
        //       req.body,
        //       { new: true }
        //     );
        //     if (!updatedItem) {
        //       res.status(404).json({ msg: 'Item not found' });
        //     }
        //     res.status(201)
        //     .json({
        //       success: true,
        //       errors: [],
        //       status: 200,
        //       message:  '',
        //       data: [updatedItem]
        //   });
        //   } catch (err: any) {
        //     console.error(err.message);
        //     res.status(500).send('Server Error');
        //   }
        // };
        // Update - PUT request handler
        this.updateMenuItemsLockOrders = async (req, res) => {
            try {
                req.body.closedBy = new ObjectId(req.authData.id);
                req.body.activeState = false;
                // Update item by ID in database
                const updatedItem = await invoice_menu_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
                if (!updatedItem) {
                    res.status(404).json({ msg: 'Item not found' });
                }
                if (updatedItem) {
                    updatedItem.updateTotal()
                        .then(total => {
                        // console.log('Updated total:', total);
                    })
                        .catch(error => {
                        console.error('Error updating total:', error);
                    });
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
        // Update - PUT request handler
        this.updateMenuItems = async (req, res) => {
            try {
                // Update item by ID in database
                const updatedItem = await invoice_menu_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
                if (!updatedItem) {
                    res.status(404).json({ msg: 'Item not found' });
                }
                if (updatedItem) {
                    updatedItem.updateTotal()
                        .then(total => {
                        // console.log('Updated total:', total);
                    })
                        .catch(error => {
                        console.error('Error updating total:', error);
                    });
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
    }
}
exports.InvoiceMenuController = InvoiceMenuController;
