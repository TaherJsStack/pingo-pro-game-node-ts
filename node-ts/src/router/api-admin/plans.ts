import { NextFunction, Request, Response, Router } from 'express';
import { check, validationResult } from 'express-validator';
import { ValidationError } from '../../errors/AppError';
import { AdminPlanController } from '../../controllers/root-api/plan';

const router = Router();
const controller = new AdminPlanController();

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
router.get('/:id', controller.getItemById.bind(controller));
router.put('/:id', controller.updateItem.bind(controller));
router.delete('/:id', controller.deleteItem.bind(controller));

export default router;
