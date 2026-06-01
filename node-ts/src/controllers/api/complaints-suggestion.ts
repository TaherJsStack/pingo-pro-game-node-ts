// import { CRUDController } from './base/CRUDController';
import { IComplaintsSuggestion } from '../../types';
import { CRUDController } from '../base/CRUDController';
import { complaintsSuggestionRepository } from '../../repositories/instances';

export class ComplaintsSuggestionController extends CRUDController<IComplaintsSuggestion> {
  constructor() {
    super(complaintsSuggestionRepository);
  }
  
}

