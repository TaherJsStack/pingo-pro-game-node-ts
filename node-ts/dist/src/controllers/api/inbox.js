"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InboxController = void 0;
const inbox_1 = __importDefault(require("../../models/inbox"));
const CRUDController_1 = require("../base/CRUDController");
const { ObjectId } = require('mongoose').Types;
class InboxController extends CRUDController_1.CRUDController {
    constructor() {
        super(inbox_1.default);
    }
    async sendWelcomMessage(userId) {
        try {
            const message = new inbox_1.default();
            await message.$set('ownerId', new ObjectId(userId));
            await message.$set('title', 'welcom to our inbox');
            await message.$set('type', 'welcom');
            await message.$set('context', 'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Qui perspiciatis quas aliquam natus animi quod modi ex placeat incidunt veritatis voluptatum dolore repudiandae illo vel quo, doloremque ipsum tempore deserunt.');
            const messageRes = await message.save();
            return messageRes;
        }
        catch (error) {
            console.log('sendWelcomMessage error ---> ', error);
        }
    }
    getInbox(userId) {
        return inbox_1.default.find({ ownerId: new ObjectId(userId) });
    }
}
exports.InboxController = InboxController;
