
import ComplaintsSuggestionModel from '../../models/complaints-suggestion';
import { CRUDController } from './base/CRUDController';
import { IComplaintsSuggestion } from '../../models/interfaces/complaints-suggestion.interface';

export class ComplaintsSuggestionController extends CRUDController<IComplaintsSuggestion> {
  constructor() {
    super(ComplaintsSuggestionModel);
  }
  
}
