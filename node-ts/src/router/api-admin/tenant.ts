import express from 'express';
import { TenantAdminController } from '../../controllers/root-api/tenant';
import { asyncHandler } from '../../util/asyncHandler';

const router = express.Router();
const controller = new TenantAdminController();

router.get('/', asyncHandler(controller.getAllItems));
router.get('/:id', asyncHandler(controller.getItemById));
router.patch('/:id/toggle-active', asyncHandler(controller.toggleActive));
router.get('/:id/kpi', asyncHandler(controller.getTenantKpi));

export default router;
