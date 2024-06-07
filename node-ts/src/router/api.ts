import express from 'express';

import authRouterAPI from './api/auth';
import employeesAPI from './api/employees';
import brancheAPI from './api/branche';
import categoriesAPI from './api/categories';
import clientsAPI from './api/client';
import sessionsAPI from './api/sessions';
import invoiceAPI from './api/invoice';
import menuAPI from './api/menu';
import pricingAPI from './api/pricing';
import invoiceMenugAPI from './api/invoice-menu';
import statisticsgAPI from './api/statistics';
import addressAPI from './api/address';
import inboxAPI from './api/inbox';
import complaintsSuggestionAPI from './api/complaints-suggestion';

// Import middleware if needed
// import signReqData from '../middleware/sign-req-data';

const routerAPI = express();

// Use middleware if needed
// routerAPI.use(signReqData);

// Define routes
routerAPI.use("/auth",                  authRouterAPI);
routerAPI.use("/employees",             employeesAPI);
routerAPI.use("/branches",              brancheAPI);
routerAPI.use("/categories",            categoriesAPI);
routerAPI.use("/clients",               clientsAPI);
routerAPI.use("/sessions",              sessionsAPI);
routerAPI.use("/invoice",               invoiceAPI);
routerAPI.use("/menu",                  menuAPI);
routerAPI.use("/pricing",               pricingAPI);
routerAPI.use("/invoice-menu",          invoiceMenugAPI);
routerAPI.use("/statistics",            statisticsgAPI);
routerAPI.use("/address",               addressAPI);
routerAPI.use("/inbox",                 inboxAPI);
routerAPI.use("/complaints-suggestion", complaintsSuggestionAPI);

// Export the router
export default routerAPI;
