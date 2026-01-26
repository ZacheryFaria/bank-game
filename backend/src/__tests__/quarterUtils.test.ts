import { describe, it, expect } from "vitest";
import {
  GAME_EPOCH,
  getFiscalQuarter,
  getFiscalYear,
  getQuarterStart,
  getQuarterEnd,
  getQuartersCrossed,
} from "../engine/quarterUtils.js";

describe("quarterUtils", () => {
  describe("GAME_EPOCH", () => {
    it("should be set to 2024-01-01", () => {
      expect(GAME_EPOCH).toEqual(new Date("2024-01-01T00:00:00.000Z"));
    });
  });

  describe("getFiscalQuarter", () => {
    it("should return Q1 for January", () => {
      const date = new Date("2024-01-15T00:00:00.000Z");
      expect(getFiscalQuarter(date)).toBe(1);
    });

    it("should return Q1 for February", () => {
      const date = new Date("2024-02-15T00:00:00.000Z");
      expect(getFiscalQuarter(date)).toBe(1);
    });

    it("should return Q1 for March", () => {
      const date = new Date("2024-03-15T00:00:00.000Z");
      expect(getFiscalQuarter(date)).toBe(1);
    });

    it("should return Q2 for April", () => {
      const date = new Date("2024-04-15T00:00:00.000Z");
      expect(getFiscalQuarter(date)).toBe(2);
    });

    it("should return Q3 for July", () => {
      const date = new Date("2024-07-15T00:00:00.000Z");
      expect(getFiscalQuarter(date)).toBe(3);
    });

    it("should return Q4 for October", () => {
      const date = new Date("2024-10-15T00:00:00.000Z");
      expect(getFiscalQuarter(date)).toBe(4);
    });

    it("should return Q4 for December", () => {
      const date = new Date("2024-12-31T00:00:00.000Z");
      expect(getFiscalQuarter(date)).toBe(4);
    });
  });

  describe("getFiscalYear", () => {
    it("should return correct year", () => {
      const date = new Date("2024-06-15T00:00:00.000Z");
      expect(getFiscalYear(date)).toBe(2024);
    });

    it("should return 2025 for 2025 date", () => {
      const date = new Date("2025-01-01T00:00:00.000Z");
      expect(getFiscalYear(date)).toBe(2025);
    });
  });

  describe("getQuarterStart", () => {
    it("should return Jan 1 for Q1", () => {
      const quarterEnd = new Date("2024-03-31T23:59:59.999Z");
      const start = getQuarterStart(quarterEnd);
      expect(start).toEqual(new Date("2024-01-01T00:00:00.000Z"));
    });

    it("should return Apr 1 for Q2", () => {
      const quarterEnd = new Date("2024-06-30T23:59:59.999Z");
      const start = getQuarterStart(quarterEnd);
      expect(start).toEqual(new Date("2024-04-01T00:00:00.000Z"));
    });

    it("should return Jul 1 for Q3", () => {
      const quarterEnd = new Date("2024-09-30T23:59:59.999Z");
      const start = getQuarterStart(quarterEnd);
      expect(start).toEqual(new Date("2024-07-01T00:00:00.000Z"));
    });

    it("should return Oct 1 for Q4", () => {
      const quarterEnd = new Date("2024-12-31T23:59:59.999Z");
      const start = getQuarterStart(quarterEnd);
      expect(start).toEqual(new Date("2024-10-01T00:00:00.000Z"));
    });
  });

  describe("getQuarterEnd", () => {
    it("should return Mar 31 for date in Q1", () => {
      const date = new Date("2024-02-15T00:00:00.000Z");
      const end = getQuarterEnd(date);
      expect(end.getUTCFullYear()).toBe(2024);
      expect(end.getUTCMonth()).toBe(2); // March (0-indexed)
      expect(end.getUTCDate()).toBe(31);
      expect(end.getUTCHours()).toBe(23);
      expect(end.getUTCMinutes()).toBe(59);
      expect(end.getUTCSeconds()).toBe(59);
    });

    it("should return Jun 30 for date in Q2", () => {
      const date = new Date("2024-05-15T00:00:00.000Z");
      const end = getQuarterEnd(date);
      expect(end.getUTCFullYear()).toBe(2024);
      expect(end.getUTCMonth()).toBe(5); // June
      expect(end.getUTCDate()).toBe(30);
    });

    it("should return Sep 30 for date in Q3", () => {
      const date = new Date("2024-08-15T00:00:00.000Z");
      const end = getQuarterEnd(date);
      expect(end.getUTCFullYear()).toBe(2024);
      expect(end.getUTCMonth()).toBe(8); // September
      expect(end.getUTCDate()).toBe(30);
    });

    it("should return Dec 31 for date in Q4", () => {
      const date = new Date("2024-11-15T00:00:00.000Z");
      const end = getQuarterEnd(date);
      expect(end.getUTCFullYear()).toBe(2024);
      expect(end.getUTCMonth()).toBe(11); // December
      expect(end.getUTCDate()).toBe(31);
    });
  });

  describe("getQuartersCrossed", () => {
    it("should return empty array if start >= end", () => {
      const start = new Date("2024-03-15T00:00:00.000Z");
      const end = new Date("2024-03-15T00:00:00.000Z");
      const quarters = getQuartersCrossed(start, end);
      expect(quarters).toEqual([]);
    });

    it("should return empty array if end before start", () => {
      const start = new Date("2024-03-15T00:00:00.000Z");
      const end = new Date("2024-02-15T00:00:00.000Z");
      const quarters = getQuartersCrossed(start, end);
      expect(quarters).toEqual([]);
    });

    it("should return single quarter when crossing Q1->Q2 boundary", () => {
      const start = new Date("2024-03-20T00:00:00.000Z");
      const end = new Date("2024-04-10T00:00:00.000Z");
      const quarters = getQuartersCrossed(start, end);

      expect(quarters).toHaveLength(1);
      expect(quarters[0].fiscalYear).toBe(2024);
      expect(quarters[0].fiscalQuarter).toBe(1);
      expect(quarters[0].quarterEnd.getUTCMonth()).toBe(2); // March
      expect(quarters[0].quarterEnd.getUTCDate()).toBe(31);
    });

    it("should return empty array if staying within same quarter", () => {
      const start = new Date("2024-01-10T00:00:00.000Z");
      const end = new Date("2024-01-20T00:00:00.000Z");
      const quarters = getQuartersCrossed(start, end);
      expect(quarters).toEqual([]);
    });

    it("should return two quarters when crossing two boundaries", () => {
      const start = new Date("2024-02-15T00:00:00.000Z");
      const end = new Date("2024-08-15T00:00:00.000Z");
      const quarters = getQuartersCrossed(start, end);

      expect(quarters).toHaveLength(2);

      // Q1 end
      expect(quarters[0].fiscalYear).toBe(2024);
      expect(quarters[0].fiscalQuarter).toBe(1);

      // Q2 end
      expect(quarters[1].fiscalYear).toBe(2024);
      expect(quarters[1].fiscalQuarter).toBe(2);
    });

    it("should return four quarters when spanning entire year", () => {
      const start = new Date("2024-01-01T00:00:00.000Z");
      const end = new Date("2025-01-01T00:00:00.000Z");
      const quarters = getQuartersCrossed(start, end);

      expect(quarters).toHaveLength(4);

      expect(quarters[0].fiscalQuarter).toBe(1);
      expect(quarters[1].fiscalQuarter).toBe(2);
      expect(quarters[2].fiscalQuarter).toBe(3);
      expect(quarters[3].fiscalQuarter).toBe(4);
    });

    it("should handle year boundary crossing", () => {
      const start = new Date("2024-11-15T00:00:00.000Z");
      const end = new Date("2025-04-15T00:00:00.000Z");
      const quarters = getQuartersCrossed(start, end);

      expect(quarters).toHaveLength(2);

      // Q4 2024
      expect(quarters[0].fiscalYear).toBe(2024);
      expect(quarters[0].fiscalQuarter).toBe(4);

      // Q1 2025
      expect(quarters[1].fiscalYear).toBe(2025);
      expect(quarters[1].fiscalQuarter).toBe(1);
    });

    it("should handle 24-hour period (24 quarters in game time)", () => {
      // This simulates a player being idle for 24 real hours = 24 game quarters
      const start = new Date("2024-01-01T00:00:00.000Z");
      // 24 quarters = 6 years (4 quarters per year)
      const end = new Date("2030-01-01T00:00:00.000Z");
      const quarters = getQuartersCrossed(start, end);

      // 6 years * 4 quarters = 24 quarters
      expect(quarters).toHaveLength(24);
    });

    it("should not include quarter if end is before quarter end", () => {
      const start = new Date("2024-01-01T00:00:00.000Z");
      const end = new Date("2024-03-30T00:00:00.000Z"); // Before Q1 ends
      const quarters = getQuartersCrossed(start, end);

      expect(quarters).toEqual([]);
    });

    it("should include quarter if end is exactly at quarter end", () => {
      const start = new Date("2024-01-01T00:00:00.000Z");
      const end = new Date("2024-03-31T23:59:59.999Z");
      const quarters = getQuartersCrossed(start, end);

      expect(quarters).toHaveLength(1);
      expect(quarters[0].fiscalQuarter).toBe(1);
    });
  });
});
