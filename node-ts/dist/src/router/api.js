"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("./api/auth"));
const employees_1 = __importDefault(require("./api/employees"));
const branche_1 = __importDefault(require("./api/branche"));
const categories_1 = __importDefault(require("./api/categories"));
const client_1 = __importDefault(require("./api/client"));
const sessions_1 = __importDefault(require("./api/sessions"));
const invoice_1 = __importDefault(require("./api/invoice"));
const menu_1 = __importDefault(require("./api/menu"));
const pricing_1 = __importDefault(require("./api/pricing"));
const invoice_menu_1 = __importDefault(require("./api/invoice-menu"));
const statistics_1 = __importDefault(require("./api/statistics"));
const address_1 = __importDefault(require("./api/address"));
const complaints_suggestion_1 = __importDefault(require("./api/complaints-suggestion"));
// Import middleware if needed
// import signReqData from '../middleware/sign-req-data';
const routerAPI = (0, express_1.default)();
// Use middleware if needed
// routerAPI.use(signReqData);
// Define routes
routerAPI.use("/auth", auth_1.default);
routerAPI.use("/employees", employees_1.default);
routerAPI.use("/branches", branche_1.default);
routerAPI.use("/categories", categories_1.default);
routerAPI.use("/clients", client_1.default);
routerAPI.use("/sessions", sessions_1.default);
routerAPI.use("/invoice", invoice_1.default);
routerAPI.use("/menu", menu_1.default);
routerAPI.use("/pricing", pricing_1.default);
routerAPI.use("/invoice-menu", invoice_menu_1.default);
routerAPI.use("/statistics", statistics_1.default);
routerAPI.use("/address", address_1.default);
routerAPI.use("/complaints-suggestion", complaints_suggestion_1.default);
// Export the router
exports.default = routerAPI;
