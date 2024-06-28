"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const statistics_1 = require("../../controllers/api/statistics");
const router = express_1.default.Router();
const statisticsController = new statistics_1.StatisticsController();
router.get("/getGroupedInvoicesByClosedBy", (req, res) => {
    statisticsController.getGroupedInvoicesByClosedBy(req, res);
});
router.get("/member/:id", (req, res) => {
    statisticsController.getGroupedInvoicesByClosedByMemberId(req, res);
});
exports.default = router;
