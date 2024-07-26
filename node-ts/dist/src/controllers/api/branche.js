"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrancheController = void 0;
const branche_1 = __importDefault(require("../../models/branche"));
const CRUDController_1 = require("../base/CRUDController");
class BrancheController extends CRUDController_1.CRUDController {
    constructor() {
        super(branche_1.default);
        this.createItem = async (req, res) => {
            try {
                const newItem = new this.model(req.body);
                const savedItem = await newItem.save();
                // const totalData = await this.model.find().countDocuments();
                this.sendResponse(req, res, 201, [savedItem], 1, 'new branche added successfully, with id: ' + req.body.ownerId);
            }
            catch (err) {
                this.sendErrorResponse(req, res, err);
            }
        };
        this.getAllItems = async (req, res) => {
            try {
                const filter = this.parseFilter(req.query.Filter);
                // console.log('Clients getAllItems filter -->', filter);
                // console.log('filter -->', this.model);
                for (const property in filter) {
                    console.log(`${property}: ${filter[property]}`);
                    if (!(property in this.model.schema.obj)) {
                        delete filter[property];
                    }
                    if (property !== 'ownerId') {
                        delete filter[property];
                    }
                }
                console.log('branches filter -->', filter);
                if (!filter['ownerId']) {
                    return this.sendResponse(req, res, 200, [], 0, 'no branche found!!');
                }
                const items = await this.model.find(filter).sort({ createdAt: -1, activeState: 1 });
                const totalData = await this.model.find(filter).countDocuments();
                this.sendResponse(req, res, 200, items, totalData, 'branche');
                // req: Request, res: Response, statusCode: number, data: any, totalData?: number, message?: string
            }
            catch (err) {
                this.sendErrorResponse(req, res, err);
            }
        };
    }
}
exports.BrancheController = BrancheController;
