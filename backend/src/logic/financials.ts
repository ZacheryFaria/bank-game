import { Prisma } from "@prisma/client";
import prisma from "../lib/db.js";
import { convertSnapshotDecimals } from "../lib/prismaHelpers.js";

const DEFAULT_SNAPSHOT_LIMIT = 100;

interface GetSnapshotsFilters {
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export async function getSnapshots(
  bankId: string,
  filters?: GetSnapshotsFilters
) {
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

  const where: Prisma.SnapshotWhereInput = { bankId };

  if (filters?.startDate || filters?.endDate) {
    where.periodEnd = {};
    if (filters.startDate) {
      (where.periodEnd as Prisma.DateTimeFilter).gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      (where.periodEnd as Prisma.DateTimeFilter).lte = new Date(filters.endDate);
    }
  }

  const snapshots = await prisma.snapshot.findMany({
    where,
    orderBy: { periodEnd: "desc" },
    take: filters?.limit || DEFAULT_SNAPSHOT_LIMIT,
  });

  const convertedSnapshots = snapshots.map(convertSnapshotDecimals);

  return {
    success: true,
    snapshots: convertedSnapshots,
  };
}
