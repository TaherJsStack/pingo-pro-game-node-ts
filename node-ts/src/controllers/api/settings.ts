import { ISettings } from '../../models/interfaces/settings.interface';
import { CRUDController } from '../base/CRUDController';
import { settingsRepository } from '../../repositories/instances';

export class SettingsController extends CRUDController<ISettings> {
  constructor() {
    super(settingsRepository);
  }
}

export default new SettingsController();
