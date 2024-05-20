import express from 'express';
import * as authCtrl from '../../controllers/api/auth';

// Define the router
const authRouter = express.Router();

// Route handlers
authRouter.post("/", authCtrl.saveAuth);
authRouter.put("/member/:id", authCtrl.updateOne);
authRouter.put("/updatePassword", authCtrl.updatePassword);
authRouter.post("/login", authCtrl.login);
authRouter.get("/", authCtrl.getAll);
authRouter.get('/checkEmail/:email', authCtrl.checkEmail);
authRouter.get('/checkPassword/:id/:password', authCtrl.checkPassword);
authRouter.get('/getById/:authId', authCtrl.getById);
authRouter.delete('/:id', authCtrl.deleteOne);

// Export the router
export default authRouter;
