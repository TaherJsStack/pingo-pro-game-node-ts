import express, { Router, Request, Response } from 'express';
import signReqData from '../../middleware/sign-req-data';
import settingsController from '../../controllers/api/settings';

const router: Router = express.Router();

router.get('', signReqData, async (req: Request, res: Response) => {
  await settingsController.getAllItems(req, res);
});

router.post('', signReqData, async (req: Request, res: Response) => {
  await settingsController.createItem(req as any, res);
});

router.put('/member/:id', signReqData, async (req: Request, res: Response) => {
  await settingsController.updateItem(req, res);
});

router.delete('/:id', signReqData, async (req: Request, res: Response) => {
  await settingsController.deleteItem(req, res);
});

router.get('/:id', signReqData, async (req: Request, res: Response) => {
  await settingsController.getItemById(req, res);
});

export default router;
