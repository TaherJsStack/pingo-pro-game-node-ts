"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const statistics_1 = require("../../controllers/api/statistics");
const router = express_1.default.Router();
router.get("/getGroupedInvoicesByClosedBy", (req, res) => {
    (0, statistics_1.getGroupedInvoicesByClosedBy)(req, res);
});
exports.default = router;
