import express, { Router, Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import { MenuController } from '../../controllers/api/menu';
// import checkAuth from '../../middleware/check-auth';
import signReqData from '../../middleware/sign-req-data';
import { IMenu } from '../../models/interfaces/menu.interface';
import MenuModel from '../../models/menu';

const router: Router = express.Router();
const menuController: MenuController = new MenuController();

interface CreateItemRequest extends Request {
  body: IMenu;
  authData: {
    id: string;
  };
}

// Route: POST /items (Create item)
router.post(
  '',
  signReqData,
  [
    // Validation rules using express-validator
    check('brancheId').notEmpty().withMessage('brancheId is required'),
    check('name').notEmpty().withMessage('name is required'),
    check('price').notEmpty().withMessage('price is required'),
  ],
  async (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, brancheId } = req.body;
    const isName = await MenuModel.findOne({
      name,
      brancheId,
      ...(req as any).authData?.tenantId ? { tenantId: (req as any).authData.tenantId } : {},
    });

    if (isName) {
      return res.status(400).json({ errors: [{ path: 'name', msg: 'Name is already exists' }] });
    }

    // Call controller method to create item
    await menuController.createItem(req as CreateItemRequest, res);
  }
);

// Route: PUT /items/:id (Update item)
router.put(
  '/updateMenuItemsStockCount',
  signReqData,
  // [
  //   // Validation rules using express-validator
  //   // check('branche').optional().notEmpty().withMessage('branche is required'),
  //   // check('address')
  //   //   .optional()
  //   //   .notEmpty()
  //   //   .withMessage('address is required')
  // ],
  async (req: Request, res: Response) => {
    // console.log('updateMenuItemsStockCount -->', req.body);
    // Check for validation errors
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   return res.status(400).json({ errors: errors.array() });
    // }

    // Call controller method to update item
    await menuController.updateManyItems(req, res);
  }
);


// Route: PUT /items/:id (Update item)
router.put(
  '/:id',
  signReqData,
  [
    // Validation rules using express-validator
    check('branche').optional().notEmpty().withMessage('branche is required'),
    check('address')
      .optional()
      .notEmpty()
      .withMessage('address is required')
  ],
  async (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Call controller method to update item
    await menuController.updateItem(req, res);
  }
);

// Other routes for GET (Read) and DELETE operations...
router.get("", signReqData, menuController.getAllItems);

router.delete('/:id', signReqData, menuController.deleteItem)


export default router;
