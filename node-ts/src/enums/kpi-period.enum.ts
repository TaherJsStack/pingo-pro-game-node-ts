/**
 * Time bucket used by the statistics/KPI aggregations.
 * Values double as MongoDB `$dateTrunc` units.
 */
export enum KpiPeriod {
  Day = 'day',
  Week = 'week',
  Month = 'month',
  Year = 'year',
}
