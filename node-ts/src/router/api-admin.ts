import express from 'express';

import statisticsRouterAPI           from './api-admin/statistics';
import authsRouterAPI                from './api-admin/auths';
import complaintsSuggestionRouterAPI from './api-admin/complaints-suggestion';


// Import middleware if needed
// import signReqData from '../middleware/sign-req-data';

const routerAPI = express();

// Use middleware if needed
// routerAPI.use(signReqData);

// Define routes
routerAPI.use("/statistics",            statisticsRouterAPI);
routerAPI.use("/auths",                 authsRouterAPI);
routerAPI.use("/complaints-suggestion", complaintsSuggestionRouterAPI);

// Export the router
export default routerAPI;
