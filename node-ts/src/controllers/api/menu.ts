// import { CRUDController } from './base/CRUDController';
import { IMenu } from '../../types';
import { CRUDController } from '../base/CRUDController';
import { menuRepository } from '../../repositories/instances';


export class MenuController  extends CRUDController<IMenu> {
  constructor() {
    super(menuRepository);
  }

}

