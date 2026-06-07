import { ActivityFields, BaseEntity, ObjectId } from './common.interface';
import { NotificationChannel } from '../../enums/notification-channel.enum';

export interface ISettings extends BaseEntity, ActivityFields {
  ownerId: ObjectId;
  createdBy: ObjectId;
  tenantId?: ObjectId | null;
  theme: string;
  language: string;
  receipt?: {
    paperSize: '58mm' | '80mm';
    headerText: string;
    footerText: string;
    showLogo: boolean;
  };
  notifications?: {
    enabled: boolean;
    channels: NotificationChannel[];
    whatsappNumber?: string;
    telegramChatId?: string;
    shiftOpened: boolean;
    shiftClosed: boolean;
    tableClosed: boolean;
    dailySummary: boolean;
    tableCloseThreshold: number;
  };
}
