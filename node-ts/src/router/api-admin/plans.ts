import { NextFunction, Request, Response, Router } from 'express';
import { check, validationResult } from 'express-validator';
import { ValidationError } from '../../errors/AppError';
import { AdminPlanController } from '../../controllers/root-api/plan';

const router = Router();
const controller = new AdminPlanController();

const mongoIdParam = (field: string) =>
  check(field).isMongoId().withMessage(`${field} must be a valid MongoId`);

function ensureValidRequest(req: Parameters<typeof validationResult>[0]): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array().map((item) => item.msg).join(', '));
  }
}

router.post('/defaults', controller.createDefaults.bind(controller));
router.post(
  '/',
  [
    check('name').notEmpty().withMessage('name is required'),
    check('price').isFloat({ min: 0 }).withMessage('price must be >= 0'),
    check('durationMonths').isInt({ min: 1 }).withMessage('durationMonths must be >= 1'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      ensureValidRequest(req);
      await controller.createItem(req as any, res);
    } catch (error) {
      next(error);
    }
  }
);
router.get('/', controller.getAllItems.bind(controller));
router.get(
  '/:id',
  mongoIdParam('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      ensureValidRequest(req);
      await controller.getItemById(req, res);
    } catch (error) {
      next(error);
    }
  }
);
router.put(
  '/:id',
  [
    mongoIdParam('id'),
    check('name').optional().notEmpty().withMessage('name cannot be blank'),
    check('price').optional().isFloat({ min: 0 }).withMessage('price must be >= 0'),
    check('durationMonths').optional().isInt({ min: 1 }).withMessage('durationMonths must be >= 1'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      ensureValidRequest(req);
      await controller.updateItem(req, res);
    } catch (error) {
      next(error);
    }
  }
);
router.delete(
  '/:id',
  mongoIdParam('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      ensureValidRequest(req);
      await controller.deleteItem(req, res);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
