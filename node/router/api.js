const express         = require("express");
const routerAPI       = express();

const authRouterAPI   = require('./api/auth');
const employeesAPI   = require('./api/employees');
const brancheAPI      = require('./api/branche');
const categoriesAPI   = require('./api/categories');
const clientsAPI      = require('./api/client');
const sessionsAPI     = require('./api/sessions');
const invoiceAPI      = require('./api/invoice');
const menuAPI         = require('./api/menu');
const pricingAPI      = require('./api/pricing');
const invoiceMenugAPI = require('./api/invoice-menu');
const statisticsgAPI  = require('./api/statistics');

// const signReqData     = require('../middleware/sign-req-data');

// routerAPI.use(signReqData);

routerAPI.use("/auth",         authRouterAPI);
routerAPI.use("/employees",    employeesAPI);
routerAPI.use("/branches",     brancheAPI);
routerAPI.use("/categories",   categoriesAPI);
routerAPI.use("/clients",      clientsAPI);
routerAPI.use("/sessions",     sessionsAPI);
routerAPI.use("/invoice",      invoiceAPI);
routerAPI.use("/menu",         menuAPI);
routerAPI.use("/pricing",      pricingAPI);
routerAPI.use("/invoice-menu", invoiceMenugAPI);
routerAPI.use("/statistics",   statisticsgAPI);

module.exports = routerAPI;