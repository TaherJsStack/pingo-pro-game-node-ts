/**
 * Account type for an Auth record.
 * Values are the persisted strings — do not change them without a data migration.
 */
export enum AuthType {
  Owner = 'owner',
  Employee = 'employee',
  Root = 'root',
  Client = 'client',
}
