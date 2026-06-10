import { NextFunction, Request, Response, Router } from 'express';
import { check, validationResult } from 'express-validator';
import {AuthController} from '../../controllers/api/auth';
import signReqData from '../../middleware/sign-req-data';

const router:Router = Router();
const authController:AuthController = new AuthController();

router.get('/check-phone/:phone',  authController.checkPhone);
router.get('/check-email/:email',  authController.checkEmail.bind(authController));
router.post('/check-password/:id', authController.checkPassword.bind(authController));
router.put('/update-password/:id', signReqData, authController.updatePassword.bind(authController));
router.post(
  '',
  [
    check('branche')
      .custom((value, { req }) => {
        const hasBranche = typeof value === 'string' && value.trim().length > 0;
        const clubName = req.body?.club?.name || req.body?.club?.branche || req.body?.club;
        const hasClubName = typeof clubName === 'string' && clubName.trim().length > 0;
        if (!hasBranche && !hasClubName) {
          throw new Error('branche or club name is required');
        }
        return true;
      }),
    check('termsAccepted')
      .custom((value) => {
        if (value !== true) {
          throw new Error('Terms & Conditions must be accepted');
        }
        return true;
      }),
  ],
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    return authController.saveAuth(req, res, next);
  }
);
router.post('/refresh',            authController.refreshToken.bind(authController));
router.post(
  '/select-branch',
  signReqData,
  [check('brancheId').notEmpty().withMessage('brancheId is required')],
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return authController.selectBranch(req, res, next);
  }
);
router.put('/:id',                 signReqData, authController.updateOne);
router.post('/login',              authController.login.bind(authController));
router.get('/get-all',             signReqData, authController.getAll.bind(authController));
router.get('/get-by-id/:authId',   signReqData, authController.getById.bind(authController));
router.delete('/delete-one/:id',   signReqData, authController.deleteOne.bind(authController));

export default router;
