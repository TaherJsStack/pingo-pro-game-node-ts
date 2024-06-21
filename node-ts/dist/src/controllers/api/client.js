"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientController = void 0;
const client_1 = __importDefault(require("../../models/client"));
const CRUDController_1 = require("./base/CRUDController");
class ClientController extends CRUDController_1.CRUDController {
    constructor() {
        super(client_1.default);
        this.checkPhone = async (req, res) => {
            // console.log('checkPhone req.params ---> ', req.params);
            let { phone } = req.params;
            // let { activeState, ...otherFilters } = req.query; // Assuming additional filters are sent via query params
            let filter = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : {};
            let { ownerId, brancheId } = filter;
            // console.log('filter---> ', filter);
            // const filter2 = this.parseFilter(req.query.Filter);
            try {
                // Build query object dynamically
                let query = { phone: { $regex: phone, $options: 'i' } }; // Regular expression for phone number
                query.activeState = true; // Convert to boolean
                query.brancheId = brancheId;
                Object.assign(query);
                // console.log('checkPhone query ---> ', query);
                // Use regular expression to filter phone numbers that contain the provided string
                let users = await client_1.default.find(query);
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
            }
            catch (err) {
                console.log('catch checkPhone error ---> ', err);
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
        this.getAllItemsPagination = async (req, res) => {
            try {
                let { page = 1, limit = 10, filterBy, filterValue } = req.query;
                let filter = {};
                // if (filterBy && filterValue) {
                //   filter[filterBy] = { $regex: new RegExp(filterValue, 'i') };
                // }
                const items = await client_1.default.find(filter)
                    .skip((+page - 1) * +limit)
                    .limit(+limit);
                const totalCount = await client_1.default.countDocuments(filter);
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
    }
}
exports.ClientController = ClientController;
