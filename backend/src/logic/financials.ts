import { Prisma } from "@prisma/client";
import prisma from "../lib/db.js";
import { convertSnapshotDecimals } from "../lib/prismaHelpers.js";

const DEFAULT_SNAPSHOT_LIMIT = 100;

interface GetSnapshotsFilters {
  year?: number;
  quarter?: number;
  limit?: number;
}

export async function getQuarterlySnapshots(
  bankId: string,
  filters?: GetSnapshotsFilters
) {
  // First, verify the bank exists
  const bank = await prisma.bank.findUnique({
    where: { id: bankId },
    select: { id: true },
  });

  if (!bank) {
    return {
      success: false,
      error: "Bank not found",
    };
  }

  // Build where clause with proper type safety
  const where: Prisma.QuarterlySnapshotWhereInput = { bankId };

  if (filters?.year) {
    where.fiscalYear = filters.year;
  }

  if (filters?.quarter) {
    where.fiscalQuarter = filters.quarter;
  }

  // Query snapshots
  const snapshots = await prisma.quarterlySnapshot.findMany({
    where,
    orderBy: { quarterEnd: "desc" },
    take: filters?.limit || DEFAULT_SNAPSHOT_LIMIT,
  });

  // Convert Decimal fields to numbers
  const convertedSnapshots = snapshots.map(convertSnapshotDecimals);

  return {
    success: true,
    snapshots: convertedSnapshots,
  };
}
