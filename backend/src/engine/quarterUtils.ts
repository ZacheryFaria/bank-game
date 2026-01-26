// Game epoch - all banks share this calendar
export const GAME_EPOCH = new Date("2024-01-01T00:00:00.000Z");

// Constants
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface QuarterBoundary {
  quarterEnd: Date;
  fiscalYear: number;
  fiscalQuarter: number;
}

/**
 * Get the fiscal quarter (1-4) for a given date.
 * Q1 = Jan-Mar, Q2 = Apr-Jun, Q3 = Jul-Sep, Q4 = Oct-Dec
 */
export function getFiscalQuarter(date: Date): number {
  const month = date.getUTCMonth(); // 0-11
  return Math.floor(month / 3) + 1; // 1-4
}

/**
 * Get the fiscal year for a given date.
 */
export function getFiscalYear(date: Date): number {
  return date.getUTCFullYear();
}

/**
 * Get the start date of a quarter (first day at 00:00:00).
 */
export function getQuarterStart(quarterEnd: Date): Date {
  const quarter = getFiscalQuarter(quarterEnd);
  const year = getFiscalYear(quarterEnd);

  // Q1 starts Jan 1, Q2 starts Apr 1, Q3 starts Jul 1, Q4 starts Oct 1
  const startMonth = (quarter - 1) * 3;

  return new Date(Date.UTC(year, startMonth, 1, 0, 0, 0, 0));
}

/**
 * Get the end date of the quarter containing the given date.
 * Returns the last moment of the last day of the quarter.
 */
export function getQuarterEnd(date: Date): Date {
  const quarter = getFiscalQuarter(date);
  const year = getFiscalYear(date);

  // Q1 ends Mar 31, Q2 ends Jun 30, Q3 ends Sep 30, Q4 ends Dec 31
  const endMonth = quarter * 3 - 1; // 2, 5, 8, 11 (Mar, Jun, Sep, Dec)

  // Get the last day of the month
  const lastDay = new Date(Date.UTC(year, endMonth + 1, 0)).getUTCDate();

  // Return the last moment of that day
  return new Date(Date.UTC(year, endMonth, lastDay, 23, 59, 59, 999));
}

/**
 * Get all quarter boundaries crossed during a time period.
 * Returns an array of quarter-end dates in chronological order.
 */
export function getQuartersCrossed(
  start: Date,
  end: Date
): QuarterBoundary[] {
  if (start >= end) {
    return [];
  }

  const quarters: QuarterBoundary[] = [];

  // Get the quarter end for the start date
  let currentQuarterEnd = getQuarterEnd(start);

  // Collect all quarter ends between start and end
  while (currentQuarterEnd <= end) {
    quarters.push({
      quarterEnd: currentQuarterEnd,
      fiscalYear: getFiscalYear(currentQuarterEnd),
      fiscalQuarter: getFiscalQuarter(currentQuarterEnd),
    });

    // Move to next quarter (add 1 day to current quarter end, then get that quarter's end)
    const nextDay = new Date(currentQuarterEnd.getTime() + ONE_DAY_MS);
    currentQuarterEnd = getQuarterEnd(nextDay);
  }

  return quarters;
}
