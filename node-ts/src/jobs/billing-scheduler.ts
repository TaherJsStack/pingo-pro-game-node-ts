import cron, { ScheduledTask } from 'node-cron';
import { env } from '../config/env';
import BillingService from '../services/billing.service';

let schedulerStarted = false;
let scheduledTasks: ScheduledTask[] = [];

export function startBillingScheduler(): void {
  if (schedulerStarted || !env.billingCronEnabled) {
    return;
  }

  scheduledTasks = [
    cron.schedule('0 2 * * *', () => {
    void BillingService.processDueRenewals(new Date()).catch((error) => {
      console.error('Billing due-renewal job failed:', error?.message ?? error);
    });
    }),

    cron.schedule('*/15 * * * *', () => {
    void BillingService.reconcilePendingPayments(new Date()).catch((error) => {
      console.error('Billing reconcile job failed:', error?.message ?? error);
    });
    }),
  ];

  schedulerStarted = true;
}

export function stopBillingScheduler(): void {
  scheduledTasks.forEach((task) => task.stop());
  scheduledTasks = [];
  schedulerStarted = false;
}
