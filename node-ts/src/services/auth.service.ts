import Auth from '../models/auth';
import Password from '../models/password';
import Address from '../models/address';
import Inbox from '../models/inbox';
import Branche from '../models/branche';
import Subscription from '../models/subscription';
import Plan from '../models/plan';
import Tenant from '../models/tenant';
import { BaseRepository } from '../repositories/BaseRepository';
import { AuthRepository } from '../repositories/AuthRepository';
import { generateBcryptHash } from '../util/jwtUtil';
import { TokenManager } from '../controllers/api/token-manager';
import SubscriptionManager from '../controllers/api/subscription-manager';
import { IAuthService } from './interfaces/IAuthService';
import { AppError } from '../errors/AppError';
import { InboxType } from '../enums/inbox-type.enum';

// New owners get a self-serve free trial (no plan, no auto-renew); the billing
// expiry sweep ends it when the window closes.
const REGISTRATION_TRIAL_DAYS = 14;
// Version of the Terms & Conditions the owner agreed to at registration.
const TERMS_VERSION = '1.0';

export class AuthService implements IAuthService {
  private readonly authRepository = new AuthRepository(Auth);
  private readonly passwordRepository = new BaseRepository<any>(Password);
  private readonly addressRepository = new BaseRepository<any>(Address);
  private readonly inboxRepository = new BaseRepository<any>(Inbox);
  private readonly brancheRepository = new BaseRepository<any>(Branche);
  private readonly subscriptionRepository = new BaseRepository<any>(Subscription);
  private readonly planRepository = new BaseRepository<any>(Plan);
  private readonly tenantRepository = new BaseRepository<any>(Tenant);
  private readonly subscriptionManager = new SubscriptionManager();
  private readonly tokenManager = new TokenManager();

  async register(payload: any): Promise<{ token: string; user: any }> {
    const bcryptHash = await generateBcryptHash(payload.password, 10);
    // Terms acceptance is enforced at the router; stamp when/which version was agreed.
    if (payload.termsAccepted === true) {
      payload.termsAcceptedAt = new Date();
      payload.termsVersion = TERMS_VERSION;
    }
    const savedUser = await this.authRepository.create(payload);
    let savedBranche: any = null;
    let savedTenant: any = null;
    let subscriptionData: any = null;
    const createdInboxIds: string[] = [];
    try {
      await this.passwordRepository.create({ userId: savedUser._id, password: bcryptHash });
      await this.addressRepository.create({ ownerId: savedUser._id });
      const fallbackBranchName = `${payload.username || payload.email || 'Main'} Main Branch`;
      const branchName =
        payload?.branche ||
        payload?.club?.branche ||
        payload?.club?.name ||
        payload?.club ||
        fallbackBranchName;
      const tenantName =
        payload?.club?.name ||
        payload?.club?.branche ||
        payload?.club ||
        payload?.username ||
        payload?.email ||
        'Pingo Tenant';
      const tenantSlugBase = String(tenantName)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      savedTenant = await this.tenantRepository.create({
        ownerId: savedUser._id,
        name: tenantName,
        slug: `${tenantSlugBase || 'tenant'}-${savedUser._id.toString().slice(-6)}`,
      });
      await this.authRepository.updateById(savedUser._id.toString(), { tenantId: savedTenant._id });
      savedUser.tenantId = savedTenant._id;
      savedBranche = await this.brancheRepository.create({
        ownerId: savedUser._id,
        tenantId: savedTenant._id,
        branche: branchName,
      });
      await this.authRepository.updateById(savedUser._id.toString(), { brancheId: savedBranche._id });
      savedUser.brancheId = savedBranche._id;
      const welcomeMessage = await this.inboxRepository.create({
        ownerId: savedUser._id,
        tenantId: savedTenant._id,
        title: 'Welcome to Pingo Pro Game',
        type: InboxType.Welcome,
        context: `Welcome aboard, ${payload.username || branchName}! Your account and main branch "${branchName}" are ready. Open a session on any device to create your first invoice.`,
        isSeen: false,
      });
      createdInboxIds.push(welcomeMessage._id.toString());
      const trialDays = REGISTRATION_TRIAL_DAYS;
      // Tie the trial to the seeded Free plan when available (falls back to a
      // planless trial if the catalog hasn't been seeded yet).
      const freePlan = await this.planRepository.findOne({ code: 'free', activeState: true });
      const trialPlanId = freePlan?._id ? freePlan._id.toString() : null;
      subscriptionData = await this.subscriptionManager.createSubscription(savedUser._id.toString(), trialPlanId, trialDays);
      if (subscriptionData?._id) {
        await this.subscriptionRepository.updateById(subscriptionData._id.toString(), { tenantId: savedTenant._id });
        subscriptionData.tenantId = savedTenant._id;
      }
      const trialEndDate = new Date(subscriptionData.endDate);
      const trialMessage = await this.inboxRepository.create({
        ownerId: savedUser._id,
        tenantId: savedTenant._id,
        title: 'Free trial activated',
        type: InboxType.System,
        context: `Your free trial is active until ${trialEndDate.toISOString().split('T')[0]}.`,
        isSeen: false,
      });
      createdInboxIds.push(trialMessage._id.toString());
      const token = await this.tokenManager.generateToken({
        _id: savedUser._id.toString(),
        email: savedUser.email,
        name: `${savedUser.lastName} ${savedUser.firstName}`,
        tenantId: savedTenant._id.toString(),
        role: savedUser.role,
        permission: savedUser.permission,
      });
      return { token, user: savedUser };
    } catch (error) {
      if (createdInboxIds.length > 0) {
        await this.inboxRepository.deleteMany({ _id: { $in: createdInboxIds } });
      }
      if (subscriptionData?._id) {
        await this.subscriptionRepository.deleteById(subscriptionData._id.toString());
      }
      if (savedBranche?._id) {
        await this.brancheRepository.deleteById(savedBranche._id.toString());
      }
      if (savedTenant?._id) {
        await this.tenantRepository.deleteById(savedTenant._id.toString());
      }
      await this.authRepository.deleteById(savedUser._id.toString());
      throw new AppError('new user not added !!!');
    }
  }
}
