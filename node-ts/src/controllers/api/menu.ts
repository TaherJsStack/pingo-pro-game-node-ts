import MenuModel from '../../models/menu';
// import { CRUDController } from './base/CRUDController';
import { IMenu } from '../../models/interfaces/menu.interface';
import { CRUDController } from '../base/CRUDController';


export class MenuController  extends CRUDController<IMenu> {
  constructor() {
    super(MenuModel);
  }

}
