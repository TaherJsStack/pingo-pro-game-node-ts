export interface IDataSeedParams {
  branchId: string;   // from request body — validated against tenant
  tenantId: string;   // from authData only (never from body)
  createdBy: string;  // the authenticated user's id
  seed?: number;      // optional — makes the run deterministic for tests
}

export interface IDataSeedResult {
  shiftsCreated: number;
  sessionsCreated: number;
  invoicesCreated: number;
  invoiceMenusCreated: number;
  clientsEnsured: number;
  employeeCount: number;
  skipped: number;
  daysProcessed: number;
}
