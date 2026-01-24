import type { Bank } from "@prisma/client";

type PrismaBank = Bank & {
  rates?: any[];
  allocations?: any[];
  loanBuckets?: any[];
  depositBuckets?: any[];
};

export function convertBankDecimals(bank: PrismaBank | null): any {
  if (!bank) return null;

  return {
    ...bank,
    currentEquity: Number(bank.currentEquity),
    currentLoans: Number(bank.currentLoans),
    currentDeposits: Number(bank.currentDeposits),
  };
}
