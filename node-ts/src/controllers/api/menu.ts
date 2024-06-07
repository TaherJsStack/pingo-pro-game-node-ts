import MenuModel from '../../models/menu';
import { CRUDController } from './base/CRUDController';
import { IMenu } from '../../models/interfaces/menu.interface';


export class MenuController  extends CRUDController<IMenu> {
  constructor() {
    super(MenuModel);
  }

}
