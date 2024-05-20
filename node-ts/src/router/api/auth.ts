import { Router } from 'express';
import {AuthController} from '../../controllers/api/auth';

const router:Router = Router();
const authController:AuthController = new AuthController();

router.get('/check-email/:email', authController.checkEmail.bind(authController));
router.get('/check-password/:id/:password', authController.checkPassword.bind(authController));
router.post('/update-password', authController.updatePassword.bind(authController));
router.post('/save-auth', authController.saveAuth.bind(authController));
router.put('/update-one/:id', authController.updateOne.bind(authController));
router.post('/login', authController.login.bind(authController));
router.get('/get-all', authController.getAll.bind(authController));
router.get('/get-by-id/:authId', authController.getById.bind(authController));
router.delete('/delete-one/:id', authController.deleteOne.bind(authController));

export default router;
