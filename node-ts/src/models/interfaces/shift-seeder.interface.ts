export interface IShiftSeedParams {
  tenantId: string;
  brancheId: string;
  openedBy: string;
  monthsBack: number;
}

export interface IShiftSeedResult {
  created: number;
  skipped: number;
  employeeCount: number;
}
