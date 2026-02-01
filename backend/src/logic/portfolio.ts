import prisma from "../lib/db.js";
import { convertSnapshotDecimals } from "../lib/prismaHelpers.js";

interface PortfolioHistoryFilters {
  product?: string;
  riskClass?: string;
  period?: string;
}

function getPeriodStartDate(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "1y":
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    case "all":
      return null;
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

export async function getPortfolioHistory(
  bankId: string,
  filters?: PortfolioHistoryFilters
) {
  const bank = await prisma.bank.findUnique({
    where: { id: bankId },
    select: { id: true },
  });

  if (!bank) {
    return { success: false as const, error: "Bank not found" };
  }

  if (filters?.product && filters?.riskClass) {
    return { success: false as const, error: "Cannot filter by both product and riskClass simultaneously" };
  }

  const periodStart = getPeriodStartDate(filters?.period || "30d");

  const snapshots = await prisma.quarterlySnapshot.findMany({
    where: {
      bankId,
      ...(periodStart && { createdAt: { gte: periodStart } }),
    },
    orderBy: { createdAt: "desc" },
  });

  // Reverse to chronological order for charting
  const chronological = snapshots.reverse();

  const dataPoints = chronological.map((snapshot) => {
    const converted = convertSnapshotDecimals(snapshot);

    let balance = converted.totalLoans;
    if (filters?.product && converted.portfolioByProduct) {
      balance = converted.portfolioByProduct[filters.product] || 0;
    } else if (filters?.riskClass && converted.portfolioByRiskClass) {
      balance = converted.portfolioByRiskClass[filters.riskClass] || 0;
    }

    return {
      timestamp: snapshot.createdAt,
      fiscalYear: snapshot.fiscalYear,
      fiscalQuarter: snapshot.fiscalQuarter,
      balance,
      defaultRate: converted.defaultRate,
      totalEquity: converted.totalEquity,
      totalLoans: converted.totalLoans,
      totalDeposits: converted.totalDeposits,
      portfolioByProduct: converted.portfolioByProduct,
      portfolioByRiskClass: converted.portfolioByRiskClass,
    };
  });

  return {
    success: true as const,
    dataPoints,
    metadata: {
      period: filters?.period || "30d",
      product: filters?.product,
      riskClass: filters?.riskClass,
      totalDataPoints: dataPoints.length,
    },
  };
}
