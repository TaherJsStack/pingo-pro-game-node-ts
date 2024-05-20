const express     = require("express");
const employeesRouter  = express.Router();

const controller    = require('../../controllers/api/employees');

// const signReqData   = require('../../middleware/sign-req-data');
// const checkAuth     = require('../../middleware/check-auth');
// const checkAdmin    = require('../../middleware/check-admin');
// const checkUpdate   = require('../../middleware/check-update');

employeesRouter.post("",                  controller.saveAuth);

employeesRouter.put("/member/:id",        controller.updateOne);

employeesRouter.put("/updatePassword",    controller.updatePassword);

employeesRouter.get("",                   controller.getAllItems);

employeesRouter.get('/checkEmail/:email', controller.checkEmail)

employeesRouter.get('/getById/:authId',   controller.getById)

employeesRouter.delete('/:id',            controller.delete)


module.exports = employeesRouter;