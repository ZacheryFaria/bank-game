import prisma from "../lib/db.js";
import { convertSnapshotDecimals } from "../lib/prismaHelpers.js";

interface PortfolioHistoryFilters {
  product?: string;
  riskClass?: string;
  depositProduct?: string;
  period?: string;
  granularity?: string;
}

function getQuarterLimit(period: string): number {
  switch (period) {
    case "7d": return 4;
    case "30d": return 8;
    case "90d": return 24;
    case "1y": return 100;
    case "all": return 1000;
    default: return 8;
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

  const limit = getQuarterLimit(filters?.period || "30d");

  const snapshots = await prisma.quarterlySnapshot.findMany({
    where: { bankId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // Reverse to chronological order for charting
  const chronological = snapshots.reverse();

  const dataPoints = chronological.map((snapshot) => {
    const converted = convertSnapshotDecimals(snapshot);

    let balance = converted.totalLoans;
    if (filters?.product && converted.portfolioByProduct) {
      balance = converted.portfolioByProduct[filters.product] || 0;
    }
    if (filters?.riskClass && converted.portfolioByRiskClass) {
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
      granularity: filters?.granularity || "quarterly",
      product: filters?.product,
      riskClass: filters?.riskClass,
      depositProduct: filters?.depositProduct,
      totalDataPoints: dataPoints.length,
    },
  };
}
