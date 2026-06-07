import { RealtimeEvent } from '../enums';
import { getBranchRoom, getIo, getTenantRoom } from '../../socket';

export interface RealtimePayload {
  tenantId: string;
  brancheId?: string | null;
  sessionId?: string | null;
  invoiceId?: string | null;
  shiftId?: string | null;
  [key: string]: unknown;
}

class RealtimeService {
  emitToTenant(tenantId: string, event: RealtimeEvent | string, payload: RealtimePayload): void {
    try {
      getIo().to(getTenantRoom(tenantId)).emit(event, payload);
    } catch {
      // Realtime is best-effort; offline/unit-test paths can run without a live socket server.
    }
  }

  emitToBranch(tenantId: string, brancheId: string, event: RealtimeEvent | string, payload: RealtimePayload): void {
    try {
      getIo().to(getBranchRoom(tenantId, brancheId)).emit(event, payload);
    } catch {
      // Realtime is best-effort; offline/unit-test paths can run without a live socket server.
    }
  }
}

export default new RealtimeService();
