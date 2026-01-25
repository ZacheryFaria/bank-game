import type { Bank, QuarterlySnapshot } from "@prisma/client";

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
    rates: bank.rates?.map((r) => ({
      ...r,
      rate: Number(r.rate),
    })),
    allocations: bank.allocations?.map((a) => ({
      ...a,
      percentage: Number(a.percentage),
    })),
    loanBuckets: bank.loanBuckets?.map((b) => ({
      ...b,
      originalPrincipal: Number(b.originalPrincipal),
      currentBalance: Number(b.currentBalance),
      interestRate: Number(b.interestRate),
    })),
    depositBuckets: bank.depositBuckets?.map((b) => ({
      ...b,
      originalAmount: Number(b.originalAmount),
      currentBalance: Number(b.currentBalance),
      interestRate: Number(b.interestRate),
    })),
  };
}

export function convertRateDecimals(rates: any[]): any[] {
  return rates.map((r) => ({
    ...r,
    rate: Number(r.rate),
  }));
}

export function convertAllocationDecimals(allocations: any[]): any[] {
  return allocations.map((a) => ({
    ...a,
    percentage: Number(a.percentage),
  }));
}

export function convertSnapshotDecimals(snapshot: QuarterlySnapshot): any {
  return {
    ...snapshot,
    totalAssets: Number(snapshot.totalAssets),
    totalLoans: Number(snapshot.totalLoans),
    loanLossReserve: Number(snapshot.loanLossReserve),
    cashAndReserves: Number(snapshot.cashAndReserves),
    totalDeposits: Number(snapshot.totalDeposits),
    totalLiabilities: Number(snapshot.totalLiabilities),
    totalEquity: Number(snapshot.totalEquity),
    interestIncome: Number(snapshot.interestIncome),
    interestExpense: Number(snapshot.interestExpense),
    netInterestIncome: Number(snapshot.netInterestIncome),
    provisionForLosses: Number(snapshot.provisionForLosses),
    operatingExpenses: Number(snapshot.operatingExpenses),
    netIncome: Number(snapshot.netIncome),
    capitalRatio: Number(snapshot.capitalRatio),
    netInterestMargin: Number(snapshot.netInterestMargin),
    returnOnEquity: Number(snapshot.returnOnEquity),
    defaultRate: Number(snapshot.defaultRate),
  };
}
