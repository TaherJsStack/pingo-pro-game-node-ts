import { Request, Response } from 'express';
import BrancheModel from '../../models/branche';
// import { CRUDController } from './base/CRUDController';
import { IBranche } from '../../models/interfaces/branche.interface';
import { CRUDController } from '../base/CRUDController';


export class BrancheController extends CRUDController<IBranche> {
  constructor() {
    super(BrancheModel);
  }
  
}
