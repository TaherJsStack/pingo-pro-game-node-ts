import { Router } from 'express';
import {AuthController} from '../../controllers/api/auth';

const router:Router = Router();
const authController:AuthController = new AuthController();

router.get('/check-phone/:phone', authController.checkPhone);
router.get('/check-email/:email', authController.checkEmail.bind(authController));
router.post('/check-password/:id', authController.checkPassword.bind(authController));
router.put('/update-password/:id', authController.updatePassword.bind(authController));
router.post('',                  authController.saveAuth);
router.post('/refresh',           authController.refreshToken.bind(authController));
router.put('/:id',               authController.updateOne);
router.post('/login',            authController.login.bind(authController));
router.get('/get-all',           authController.getAll.bind(authController));
router.get('/get-by-id/:authId', authController.getById.bind(authController));
router.delete('/delete-one/:id', authController.deleteOne.bind(authController));

export default router;
