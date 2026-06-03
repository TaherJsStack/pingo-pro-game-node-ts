import express from 'express';

import statisticsRouterAPI           from './api-admin/statistics';
import authsRouterAPI                from './api-admin/auths';
import complaintsSuggestionRouterAPI from './api-admin/complaints-suggestion';
import brancheRouterAPI from './api-admin/branche';
import categoriesRouterAPI from './api-admin/categories';
import clientRouterAPI from './api-admin/client';
import inboxRouterAPI from './api-admin/inbox';
import auditRouterAPI from './api-admin/audit';
import billingRouterAPI from './api-admin/billing';


// Import middleware if needed
// import signReqData from '../middleware/sign-req-data';

const routerAPI = express();

// Use middleware if needed
// routerAPI.use(signReqData);

// Define routes
routerAPI.use("/statistics",            statisticsRouterAPI);
routerAPI.use("/auths",                 authsRouterAPI);
routerAPI.use("/complaints-suggestion", complaintsSuggestionRouterAPI);
routerAPI.use("/branches",              brancheRouterAPI);
routerAPI.use("/categories",            categoriesRouterAPI);
routerAPI.use("/clients",               clientRouterAPI);
routerAPI.use("/inbox",                 inboxRouterAPI);
routerAPI.use("/audit",                 auditRouterAPI);
routerAPI.use("/billing",               billingRouterAPI);

// Export the router
export default routerAPI;
