"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRUDController = void 0;
class CRUDController {
    constructor(model) {
        this.createItem = async (req, res) => {
            try {
                const newItem = new this.model(req.body);
                const savedItem = await newItem.save();
                res.status(201).json({
                    success: true,
                    errors: [],
                    status: 200,
                    message: '',
                    data: [savedItem],
                });
            }
            catch (err) {
                console.error('err.message -->', err.message);
                res.status(500).json({
                    success: false,
                    errors: [err.message],
                    status: 500,
                    message: '',
                    data: {},
                });
            }
        };
        this.getAllItems = async (req, res) => {
            try {
                const items = await this.model.find();
                res.status(200).json({
                    success: true,
                    errors: [],
                    status: 200,
                    message: '',
                    data: items,
                });
            }
            catch (err) {
                console.error(err.message);
                res.status(500).send('Server Error');
            }
        };
        this.getItemById = async (req, res) => {
            try {
                const item = await this.model.findById(req.params.id);
                if (!item) {
                    return res.status(404).json({ msg: 'Item not found' });
                }
                res.status(200).json({
                    success: true,
                    errors: [],
                    status: 200,
                    message: '',
                    data: item,
                });
            }
            catch (err) {
                console.error(err.message);
                res.status(500).send('Server Error');
            }
        };
        this.updateItem = async (req, res) => {
            try {
                const updatedItem = await this.model.findByIdAndUpdate(req.params.id, req.body, { new: true });
                if (!updatedItem) {
                    return res.status(404).json({ msg: 'Item not found' });
                }
                res.status(200).json({
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
        this.deleteItem = async (req, res) => {
            try {
                const deletedItem = await this.model.findByIdAndDelete(req.params.id);
                if (!deletedItem) {
                    return res.status(404).json({ msg: 'Item not found' });
                }
                res.status(200).json({
                    success: true,
                    errors: [],
                    status: 200,
                    message: '',
                    data: [deletedItem],
                });
            }
            catch (err) {
                console.error(err.message);
                res.status(500).send('Server Error');
            }
        };
        this.model = model;
    }
}
exports.CRUDController = CRUDController;
