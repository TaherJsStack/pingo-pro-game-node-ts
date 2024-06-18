import express from 'express';
import SubscriptionManager from '../../controllers/api/subscription-manager';

const router = express.Router();
const subscriptionManager = new SubscriptionManager();

// Route to create a subscription
router.post('/subscribe', async (req, res) => {
  const { userId, plan, trialDays } = req.body;
//   try {
//     const subscription = await subscriptionManager.createSubscription(userId, plan, trialDays);
//     res.status(201).json(subscription);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
});

// Route to update a subscription
router.put('/subscription/:id', async (req, res) => {
  const { id } = req.params;
  const { plan } = req.body;
//   try {
//     const subscription = await subscriptionManager.updateSubscription(id, plan);
//     if (subscription) {
//       res.json(subscription);
//     } else {
//       res.status(404).json({ error: 'Subscription not found' });
//     }
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
});

// Route to cancel a subscription
router.delete('/subscription/:id', async (req, res) => {
  const { id } = req.params;
//   try {
//     const subscription = await subscriptionManager.cancelSubscription(id);
//     if (subscription) {
//       res.json(subscription);
//     } else {
//       res.status(404).json({ error: 'Subscription not found' });
//     }
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
});

// Route to get a subscription
router.get('/subscription/:userId', async (req, res) => {
  const { userId } = req.params;
//   try {
//     const subscription = await subscriptionManager.getSubscription(userId);
//     if (subscription) {
//       res.json(subscription);
//     } else {
//       res.status(404).json({ error: 'Subscription not found' });
//     }
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
});

// Route to renew a subscription
router.put('/subscription/renew/:id', async (req, res) => {
  const { id } = req.params;
//   try {
//     const subscription = await subscriptionManager.renewSubscription(id);
//     if (subscription) {
//       res.json(subscription);
//     } else {
//       res.status(404).json({ error: 'Subscription not found' });
//     }
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
});

// Route to check if the trial period is active
router.get('/subscription/trial/:id', async (req, res) => {
  const { id } = req.params;
//   try {
//     const isActive = await subscriptionManager.isTrialPeriodActive(id);
//     res.json({ trialActive: isActive });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
});

export default router;
