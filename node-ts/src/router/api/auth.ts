import { NextFunction, Request, Response, Router } from 'express';
import { check, validationResult } from 'express-validator';
import { AuthController } from '../../controllers/api/auth';
import signReqData from '../../middleware/sign-req-data';
import { createRateLimit } from '../../middleware/rate-limit';

const router: Router = Router();
const authController: AuthController = new AuthController();
const loginRateLimit = createRateLimit(10, 15 * 60 * 1000);
const registerRateLimit = createRateLimit(5, 60 * 60 * 1000);

router.get('/check-phone/:phone', authController.checkPhone);
router.get('/check-email/:email', authController.checkEmail.bind(authController));
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
  registerRateLimit,
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array().map(e => e.msg), status: 400, message: '', data: {} });
    }
    return authController.saveAuth(req, res, next);
  }
);
router.post('/refresh', authController.refreshToken.bind(authController));
// INTENTIONAL EXCEPTION: select-branch is the token-issuance step.
// The client must send brancheId here because this is how it gets encoded into the JWT.
// All other authenticated routes must use req.authData.brancheId instead.
router.post(
  '/select-branch',
  signReqData,
  [check('brancheId').notEmpty().withMessage('brancheId is required')],
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array().map(e => e.msg), status: 400, message: '', data: {} });
    return authController.selectBranch(req, res, next);
  }
);
router.put('/:id', signReqData, authController.updateOne);
router.post('/login', loginRateLimit, authController.login.bind(authController));
router.get('/check-phone/:phone', loginRateLimit, authController.checkPhone);
router.get('/check-email/:email', loginRateLimit, authController.checkEmail.bind(authController));
router.post('/check-password/:id', loginRateLimit, authController.checkPassword.bind(authController));
router.get('/get-all', signReqData, authController.getAll.bind(authController));
router.get('/:id', signReqData, authController.getById.bind(authController));
router.delete('/delete-one/:id', signReqData, authController.deleteOne.bind(authController));

export default router;
