// import express from 'express';
import express, { Request, Response, NextFunction, Application } from 'express';

import authRouterAPI            from './api/auth';
import employeesAPI             from './api/employees';
import brancheAPI               from './api/branche';
import devicesAPI               from './api/device';
import clientsAPI               from './api/client';
import sessionsAPI              from './api/sessions';
import invoiceAPI               from './api/invoice';
import menuAPI                  from './api/menu';
import invoiceMenugAPI          from './api/invoice-menu';
import statisticsgAPI           from './api/statistics';
import addressAPI               from './api/address';
import inboxAPI                 from './api/inbox';
import settingsAPI              from './api/settings';
import notificationsAPI         from './api/notifications';
import complaintsSuggestionAPI  from './api/complaints-suggestion';
import subscriptionAPI          from './api/subscription';
import planAPI                  from './api/plan';
import shiftsAPI                from './api/shifts';
import paymentAPI               from './api/payment';

// Import middleware if needed
// import signReqData from '../middleware/sign-req-data';

const routerAPI = express();

// Use middleware if needed
// routerAPI.use(signReqData);

// Define routes
routerAPI.use("/auth",                  authRouterAPI);
routerAPI.use("/employees",             employeesAPI);
routerAPI.use("/branches",              brancheAPI);
routerAPI.use("/devices",               devicesAPI);
routerAPI.use("/clients",               clientsAPI);
routerAPI.use("/sessions",              sessionsAPI);
routerAPI.use("/invoice",               invoiceAPI);
routerAPI.use("/menu",                  menuAPI);
routerAPI.use("/invoice-menu",          invoiceMenugAPI);
routerAPI.use("/statistics",            statisticsgAPI);
routerAPI.use("/address",               addressAPI);
routerAPI.use("/inbox",                 inboxAPI);
routerAPI.use("/settings",              settingsAPI);
routerAPI.use("/notifications",         notificationsAPI);
routerAPI.use("/complaints-suggestion", complaintsSuggestionAPI);
routerAPI.use("/subscription",          subscriptionAPI);
routerAPI.use("/payment",               paymentAPI);
routerAPI.use("/plan",                  planAPI);
routerAPI.use("/shifts",                shiftsAPI);



// Export the router
export default routerAPI;
