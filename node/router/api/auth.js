const express     = require("express");
const authRouter  = express.Router();

const authCtrl    = require('../../controllers/api/auth');

// const signReqData   = require('../../middleware/sign-req-data');
// const checkAuth     = require('../../middleware/check-auth');
// const checkAdmin    = require('../../middleware/check-admin');
// const checkUpdate   = require('../../middleware/check-update');

authRouter.post("",                 authCtrl.saveAuth);

authRouter.put("/member/:id",       authCtrl.updateOne);

authRouter.put("/updatePassword",   authCtrl.updatePassword);

authRouter.post("/login",           authCtrl.login);

authRouter.get("",                              authCtrl.getAll);

authRouter.get('/checkEmail/:email',            authCtrl.checkEmail)

authRouter.get('/checkPassword/:id/:password',  authCtrl.checkPassword)

authRouter.get('/getById/:authId',              authCtrl.getById)

// authRouter.delete('/:id',      checkAdmin, checkAuth, authCtrl.delete)
authRouter.delete('/:id',      authCtrl.delete)

module.exports = authRouter;