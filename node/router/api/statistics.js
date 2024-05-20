const express     = require("express");
const router  = express.Router();

const controller    = require('../../controllers/api/statistics');

router.get("/getGroupedInvoicesByClosedBy",  controller.getGroupedInvoicesByClosedBy);


module.exports = router;