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
    where.periodEnd = {
      ...(filters.startDate && { gte: new Date(filters.startDate) }),
      ...(filters.endDate && { lte: new Date(filters.endDate) }),
    };
  }

  const snapshots = await prisma.snapshot.findMany({
    where,
    orderBy: { periodEnd: "desc" },
    take: Math.min(filters?.limit || DEFAULT_SNAPSHOT_LIMIT, 1000),
  });

  const convertedSnapshots = snapshots.map(convertSnapshotDecimals);

  return {
    success: true,
    snapshots: convertedSnapshots,
  };
}
