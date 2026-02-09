import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMatch, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBank } from "@/hooks/useBank";
import { usePortfolioHistory } from "@/hooks/usePortfolioHistory";
import { useTransactions } from "@/hooks/useTransactions";
import { apiClient } from "@/lib/api";
import {
  BloombergLayout,
  BloombergHeader,
  BloombergMain,
  BloombergGrid,
  Panel,
  StatCard,
  StatRow,
  DataGrid,
  DataGridHeader,
  DataGridBody,
  DataGridRow,
  DataGridHead,
  DataGridCell,
  TimeSeriesChart,
} from "@/components/bloomberg";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Building2, DollarSign, Clock, LogOut, PiggyBank } from "lucide-react";
import { BankRateSchema, BankAllocationSchema } from "@bank-game/shared";
import { z } from "zod";

type BankRate = z.infer<typeof BankRateSchema>;
type BankAllocation = z.infer<typeof BankAllocationSchema>;

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number) => {
  return `${value.toFixed(2)}%`;
};

const formatStringWithSeparator = (str: string, separator: string) => {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(separator);
};

const formatRiskClass = (riskClass: string) => {
  return formatStringWithSeparator(riskClass, '-');
};

const formatProduct = (product: string) => {
  if (product === 'cd') {
    return 'CD';
  }
  return formatStringWithSeparator(product, ' ');
};

// Default rate thresholds for visual indicators
const HIGH_DEFAULT_RATE_THRESHOLD = 5; // Rates above 5% show warning (red)
const MEDIUM_DEFAULT_RATE_THRESHOLD = 2; // Rates 2-5% show caution (yellow)
const LOW_DEFAULT_RATE_THRESHOLD = 1; // Rates at or below 1% show success (green)

type ProductDistribution = {
  product: string;
  balance: number;
  percentage: number;
  avgRate: number;
  defaultRate: number;
  loanCount: number;
  activeLoanCount: number;
};

type RiskDistribution = {
  riskClass: string;
  balance: number;
  percentage: number;
  avgRate: number;
  defaultRate: number;
  loanCount: number;
  activeLoanCount: number;
};

type DepositDistribution = {
  product: string;
  balance: number;
  percentage: number;
  avgRate: number;
  bucketCount: number;
};

export function Dashboard() {
  const { user, logout } = useAuth();
  const { bank, isLoading, collect, isCollecting, updateRates } = useBank();
  const navigate = useNavigate();
  const isRatesTab = useMatch('/dashboard/rates');
  const isPortfolioTab = useMatch('/dashboard/portfolio');
  const isLedgerTab = useMatch('/dashboard/ledger');

  // Fetch market rates for reference
  const { data: marketData } = useQuery({
    queryKey: ["market-rates"],
    queryFn: async () => {
      const response = await apiClient.market.getRates();
      if (response.status !== 200) {
        throw new Error("Failed to fetch market rates");
      }
      return response.body;
    },
  });

  // Individual rate state for all 6 products (stored as percentages for UI)
  const [rates, setRates] = useState({
    mortgage: 6.0,
    auto: 7.0,
    personal: 12.0,
    credit_card: 22.0,
    savings: 2.5,
    cd: 3.5,
  });

  // Portfolio history chart state
  const [historyPeriod, setHistoryPeriod] = useState<"1h" | "12h" | "1d" | "7d" | "30d" | "90d" | "1y" | "all">("1h");
  const [historyMetric, setHistoryMetric] = useState<"equity" | "loans" | "deposits">("equity");
  const { data: portfolioHistory, isLoading: isHistoryLoading } = usePortfolioHistory({ period: historyPeriod });

  // Transaction ledger state
  const [txnTypeFilter, setTxnTypeFilter] = useState<string | undefined>(undefined);
  const [txnPage, setTxnPage] = useState(1);
  const { data: txnData, isLoading: isTxnLoading } = useTransactions({
    type: txnTypeFilter,
    page: txnPage,
    limit: 50,
  });

  // Group transactions that share the same timestamp and type into single rows
  const groupedTransactions = useMemo(() => {
    if (!txnData?.transactions) return [];

    const groups = new Map<string, { key: string; timestamp: string; type: string; amount: number; count: number }>();
    for (const txn of txnData.transactions) {
      const ts = new Date(txn.timestamp).toISOString();
      const groupKey = `${ts}|${txn.type}`;
      const existing = groups.get(groupKey);
      if (existing) {
        existing.amount += txn.amount;
        existing.count += 1;
      } else {
        groups.set(groupKey, { key: groupKey, timestamp: ts, type: txn.type, amount: txn.amount, count: 1 });
      }
    }
    return Array.from(groups.values());
  }, [txnData?.transactions]);

  // Initialize rates from bank data when available
  useEffect(() => {
    if (bank?.rates && bank.rates.length > 0) {
      const bankRates: Record<string, number> = {};
      for (const rate of bank.rates) {
        bankRates[rate.product] = rate.rate * 100; // Convert to percentage
      }
      setRates((prev) => ({ ...prev, ...bankRates }));
    }
  }, [bank?.rates]);

  const activeTab = isLedgerTab ? 'ledger' : isPortfolioTab ? 'portfolio' : isRatesTab ? 'rates' : 'overview';

  const handleTabChange = (value: string) => {
    navigate(`/dashboard/${value}`);
  };

  const { productDistribution, riskDistribution } = useMemo<{
    productDistribution: ProductDistribution[];
    riskDistribution: RiskDistribution[];
  }>(() => {
    if (!bank?.loanBuckets || bank.loanBuckets.length === 0) {
      return { productDistribution: [], riskDistribution: [] };
    }

    type BucketAgg = { balance: number; weightedRate: number; loanCount: number; activeLoanCount: number };
    const emptyAgg = (): BucketAgg => ({ balance: 0, weightedRate: 0, loanCount: 0, activeLoanCount: 0 });

    const buckets = bank.loanBuckets;
    const aggregateBuckets = (keyFn: (b: typeof buckets[number]) => string) => {
      const map = new Map<string, BucketAgg>();
      for (const bucket of buckets) {
        const key = keyFn(bucket);
        const existing = map.get(key) || emptyAgg();
        map.set(key, {
          balance: existing.balance + bucket.currentBalance,
          weightedRate: existing.weightedRate + (bucket.currentBalance * bucket.interestRate),
          loanCount: existing.loanCount + bucket.loanCount,
          activeLoanCount: existing.activeLoanCount + bucket.activeLoanCount,
        });
      }
      return map;
    };

    const byProduct = aggregateBuckets((b) => b.product);
    const byRisk = aggregateBuckets((b) => b.riskClass);

    const totalLoans = bank.currentLoans;

    const productDist = Array.from(byProduct.entries()).map(([product, data]) => {
      return {
        product,
        balance: data.balance,
        percentage: totalLoans > 0 ? (data.balance / totalLoans) * 100 : 0,
        avgRate: data.balance > 0 ? data.weightedRate / data.balance : 0,
        defaultRate: data.loanCount > 0 ? ((data.loanCount - data.activeLoanCount) / data.loanCount) * 100 : 0,
        loanCount: data.loanCount,
        activeLoanCount: data.activeLoanCount,
      };
    }).sort((a, b) => b.balance - a.balance);

    const riskOrder = ['super_prime', 'prime', 'near_prime', 'subprime'];

    const riskDist = Array.from(byRisk.entries()).map(([riskClass, data]) => {
      return {
        riskClass,
        balance: data.balance,
        percentage: totalLoans > 0 ? (data.balance / totalLoans) * 100 : 0,
        avgRate: data.balance > 0 ? data.weightedRate / data.balance : 0,
        defaultRate: data.loanCount > 0 ? ((data.loanCount - data.activeLoanCount) / data.loanCount) * 100 : 0,
        loanCount: data.loanCount,
        activeLoanCount: data.activeLoanCount,
      };
    }).sort((a, b) => {
      const aIndex = riskOrder.indexOf(a.riskClass);
      const bIndex = riskOrder.indexOf(b.riskClass);
      return (aIndex === -1 ? Infinity : aIndex) - (bIndex === -1 ? Infinity : bIndex);
    });

    return { productDistribution: productDist, riskDistribution: riskDist };
  }, [bank]);

  const loanTotals = useMemo(() => {
    if (!bank?.loanBuckets || bank.loanBuckets.length === 0) {
      return { defaultRate: 0, loanCount: 0, activeLoanCount: 0 };
    }

    const totalLoanCount = bank.loanBuckets.reduce((sum, bucket) => sum + bucket.loanCount, 0);
    const totalActiveLoanCount = bank.loanBuckets.reduce((sum, bucket) => sum + bucket.activeLoanCount, 0);

    return {
      defaultRate: totalLoanCount > 0 ? ((totalLoanCount - totalActiveLoanCount) / totalLoanCount) * 100 : 0,
      loanCount: totalLoanCount,
      activeLoanCount: totalActiveLoanCount,
    };
  }, [bank]);

  const depositDistribution = useMemo<DepositDistribution[]>(() => {
    if (!bank?.depositBuckets || bank.depositBuckets.length === 0) {
      return [];
    }

    const byProduct = new Map<string, {
      balance: number;
      weightedRate: number;
      bucketCount: number;
    }>();

    for (const bucket of bank.depositBuckets) {
      const existing = byProduct.get(bucket.product) || {
        balance: 0,
        weightedRate: 0,
        bucketCount: 0,
      };

      byProduct.set(bucket.product, {
        balance: existing.balance + bucket.currentBalance,
        weightedRate: existing.weightedRate + (bucket.currentBalance * bucket.interestRate),
        bucketCount: existing.bucketCount + 1,
      });
    }

    const totalDeposits = Array.from(byProduct.values()).reduce((sum, p) => sum + p.balance, 0);

    return Array.from(byProduct.entries()).map(([product, data]) => ({
      product,
      balance: data.balance,
      percentage: totalDeposits > 0 ? (data.balance / totalDeposits) * 100 : 0,
      avgRate: data.balance > 0 ? data.weightedRate / data.balance : 0,
      bucketCount: data.bucketCount,
    })).sort((a, b) => b.balance - a.balance);
  }, [bank]);

  const depositTotals = useMemo(() => {
    return depositDistribution.reduce((acc, item) => {
      acc.balance += item.balance;
      acc.bucketCount += item.bucketCount;
      return acc;
    }, { balance: 0, bucketCount: 0 });
  }, [depositDistribution]);

  const periodToMs: Record<string, number | undefined> = {
    "1h": 1 * 60 * 60 * 1000,
    "12h": 12 * 60 * 60 * 1000,
    "1d": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
    "90d": 90 * 24 * 60 * 60 * 1000,
    "1y": 365 * 24 * 60 * 60 * 1000,
  };

  const chartData = useMemo(() => {
    if (!portfolioHistory?.dataPoints) return [];

    const getValue = (point: typeof portfolioHistory.dataPoints[number]) =>
      historyMetric === "equity"
        ? point.totalEquity
        : historyMetric === "loans"
          ? point.totalLoans
          : point.totalDeposits;

    // For 1h period, show every collection point; otherwise group by hour
    if (historyPeriod === "1h") {
      return portfolioHistory.dataPoints.map((point) => {
        const date = new Date(point.timestamp);
        return {
          timestamp: date,
          value: getValue(point),
          label: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        };
      });
    }

    // Group by hour: take the last (most recent) snapshot per hour
    const byHour = new Map<number, typeof portfolioHistory.dataPoints[number]>();
    for (const point of portfolioHistory.dataPoints) {
      const date = new Date(point.timestamp);
      const hourKey = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).getTime();
      byHour.set(hourKey, point);
    }

    return Array.from(byHour.entries())
      .sort(([a], [b]) => a - b)
      .map(([hourKey, point]) => {
        const date = new Date(hourKey);
        return {
          timestamp: date,
          value: getValue(point),
          label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        };
      });
  }, [portfolioHistory, historyMetric, historyPeriod]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-bloomberg-amber text-xl font-mono">Loading bank data...</div>
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-bloomberg-red text-xl font-mono">No bank found</div>
      </div>
    );
  }

  // Calculate cash on hand: Cash = Equity + Deposits - Loans
  const currentCash = bank.currentEquity + bank.currentDeposits - bank.currentLoans;

  const handleCollect = () => {
    collect();
  };

  const handleApplyRates = () => {
    updateRates({
      mortgage: rates.mortgage / 100,
      auto: rates.auto / 100,
      personal: rates.personal / 100,
      credit_card: rates.credit_card / 100,
      savings: rates.savings / 100,
      cd: rates.cd / 100,
    });
  };

  // Calculate average lending rate (simple average of 4 loan products)
  const avgLendingRate = (rates.mortgage + rates.auto + rates.personal + rates.credit_card) / 4;
  const nim = bank.currentLoans > 0 && avgLendingRate > 0
    ? ((avgLendingRate - rates.savings) / avgLendingRate) * 100
    : 0;

  return (
    <BloombergLayout>
      <BloombergHeader>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-bloomberg-amber" />
            <span className="font-bold text-lg text-bloomberg-amber uppercase">
              {bank.name}
            </span>
          </div>
          <div className="text-sm text-muted-foreground font-mono">
            {user?.email}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="font-mono tabular-nums">
              {new Date(bank.lastCollectedAt).toLocaleString()}
            </span>
          </div>
          <Button
            onClick={handleCollect}
            disabled={isCollecting}
            className="bg-bloomberg-green hover:bg-bloomberg-green/80 text-black font-bold"
          >
            <DollarSign className="h-4 w-4 mr-1" />
            {isCollecting ? "COLLECTING..." : "COLLECT"}
          </Button>
          <Button
            onClick={logout}
            variant="outline"
            size="icon"
            className="border-border hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </BloombergHeader>

      <BloombergMain>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
          <div className="border-b border-border bg-secondary px-2">
            <TabsList className="bg-transparent border-0 h-auto p-0">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-transparent data-[state=active]:text-bloomberg-amber data-[state=active]:border-b-2 data-[state=active]:border-bloomberg-amber rounded-none px-4 py-2 text-sm font-mono uppercase"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="rates"
                className="data-[state=active]:bg-transparent data-[state=active]:text-bloomberg-amber data-[state=active]:border-b-2 data-[state=active]:border-bloomberg-amber rounded-none px-4 py-2 text-sm font-mono uppercase"
              >
                Rate Setting
              </TabsTrigger>
              <TabsTrigger
                value="portfolio"
                className="data-[state=active]:bg-transparent data-[state=active]:text-bloomberg-amber data-[state=active]:border-b-2 data-[state=active]:border-bloomberg-amber rounded-none px-4 py-2 text-sm font-mono uppercase"
              >
                Portfolio
              </TabsTrigger>
              <TabsTrigger
                value="ledger"
                className="data-[state=active]:bg-transparent data-[state=active]:text-bloomberg-amber data-[state=active]:border-b-2 data-[state=active]:border-bloomberg-amber rounded-none px-4 py-2 text-sm font-mono uppercase"
              >
                Ledger
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="flex-1 m-0 overflow-auto">
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-4 gap-px bg-border">
                <StatCard
                  label="Cash on Hand"
                  value={Math.round(currentCash)}
                  format="number"
                  prefix="$"
                />
                <StatCard
                  label="Current Equity"
                  value={bank.currentEquity}
                  format="currency"
                  prefix="$"
                />
                <StatCard
                  label="Total Loans"
                  value={bank.currentLoans}
                  format="currency"
                  prefix="$"
                />
                <StatCard
                  label="Total Deposits"
                  value={bank.currentDeposits}
                  format="currency"
                  prefix="$"
                />
              </div>

              <BloombergGrid cols={2} gap="sm">
                <Panel title="Financial Position" headerColor="cyan">
                  <div className="space-y-1">
                    <StatRow
                      label="Cash on Hand"
                      value={Math.round(currentCash)}
                      format="number"
                      prefix="$"
                      variant={currentCash > 0 ? "positive" : "negative"}
                    />
                    <StatRow
                      label="Equity"
                      value={bank.currentEquity}
                      format="currency"
                      variant={bank.currentEquity > 0 ? "positive" : "negative"}
                    />
                    <StatRow
                      label="Loans Outstanding"
                      value={bank.currentLoans}
                      format="currency"
                    />
                    <StatRow
                      label="Deposits"
                      value={bank.currentDeposits}
                      format="currency"
                    />
                    <div className="border-t border-border my-2" />
                    <StatRow
                      label="Loan-to-Deposit Ratio"
                      value={bank.currentDeposits > 0 ? (bank.currentLoans / bank.currentDeposits) * 100 : 0}
                      format="percent"
                    />
                    <StatRow
                      label="Est. NIM"
                      value={nim}
                      format="percent"
                      variant={nim > 0 ? "positive" : "negative"}
                    />
                  </div>
                </Panel>

                <Panel title="Interest Rates" headerColor="amber">
                  <div className="space-y-1">
                    {bank.rates?.map((rate: BankRate) => (
                      <StatRow
                        key={rate.product}
                        label={rate.product}
                        value={rate.rate * 100}
                        format="percent"
                      />
                    ))}
                  </div>
                </Panel>

                <Panel title="Bank Information" headerColor="blue">
                  <div className="space-y-1">
                    <StatRow label="Bank Name" value={bank.name} />
                    <StatRow
                      label="Created"
                      value={new Date(bank.createdAt).toLocaleDateString()}
                    />
                    <StatRow
                      label="Last Collection"
                      value={new Date(bank.lastCollectedAt).toLocaleString()}
                    />
                  </div>
                </Panel>

                <Panel title="Risk Allocation" headerColor="green">
                  <div className="space-y-1">
                    {bank.allocations?.map((allocation: BankAllocation) => (
                      <StatRow
                        key={allocation.riskClass}
                        label={allocation.riskClass}
                        value={allocation.percentage * 100}
                        format="percent"
                      />
                    ))}
                  </div>
                </Panel>
              </BloombergGrid>

              <Panel
                title="PORTFOLIO HISTORY"
                headerColor="blue"
                headerRight={
                  <select
                    value={historyPeriod}
                    onChange={(e) => setHistoryPeriod(e.target.value as typeof historyPeriod)}
                    className="bg-secondary text-foreground text-xs font-mono border border-border px-2 py-1 rounded"
                  >
                    <option value="1h">1 Hour</option>
                    <option value="12h">12 Hours</option>
                    <option value="1d">1 Day</option>
                    <option value="7d">7 Days</option>
                    <option value="30d">30 Days</option>
                    <option value="90d">90 Days</option>
                    <option value="1y">1 Year</option>
                    <option value="all">All Time</option>
                  </select>
                }
              >
                <Tabs value={historyMetric} onValueChange={(v) => setHistoryMetric(v as typeof historyMetric)}>
                  <TabsList className="bg-secondary border-0 h-auto p-0 mb-2">
                    <TabsTrigger
                      value="equity"
                      className="data-[state=active]:bg-transparent data-[state=active]:text-bloomberg-green data-[state=active]:border-b data-[state=active]:border-bloomberg-green rounded-none px-3 py-1 text-xs font-mono uppercase"
                    >
                      Equity
                    </TabsTrigger>
                    <TabsTrigger
                      value="loans"
                      className="data-[state=active]:bg-transparent data-[state=active]:text-bloomberg-cyan data-[state=active]:border-b data-[state=active]:border-bloomberg-cyan rounded-none px-3 py-1 text-xs font-mono uppercase"
                    >
                      Loans
                    </TabsTrigger>
                    <TabsTrigger
                      value="deposits"
                      className="data-[state=active]:bg-transparent data-[state=active]:text-bloomberg-amber data-[state=active]:border-b data-[state=active]:border-bloomberg-amber rounded-none px-3 py-1 text-xs font-mono uppercase"
                    >
                      Deposits
                    </TabsTrigger>
                  </TabsList>
                  {isHistoryLoading ? (
                    <div className="h-[120px] flex items-center justify-center text-muted-foreground text-sm font-mono">
                      Loading...
                    </div>
                  ) : (
                    <TimeSeriesChart
                      data={chartData}
                      color={historyMetric === "equity" ? "green" : historyMetric === "loans" ? "cyan" : "amber"}
                      height={120}
                      minTimeSpanMs={periodToMs[historyPeriod]}
                    />
                  )}
                </Tabs>
              </Panel>
            </div>
          </TabsContent>

          <TabsContent value="rates" className="flex-1 m-0 overflow-auto">
            <div className="p-4 space-y-6">
              <Panel title="Loan Product Rates" headerColor="blue">
                <div className="space-y-6 p-2">
                  {/* Mortgage */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-bloomberg-cyan text-sm uppercase font-semibold">
                        Mortgage
                        {marketData?.rates.mortgage && (
                          <span className="text-xs text-muted-foreground ml-2 normal-case">
                            Market: {(marketData.rates.mortgage * 100).toFixed(2)}%
                          </span>
                        )}
                      </span>
                      <span className="text-xl font-bold font-mono tabular-nums">
                        {rates.mortgage.toFixed(2)}%
                      </span>
                    </div>
                    <Slider
                      value={[rates.mortgage]}
                      onValueChange={([v]) => setRates({ ...rates, mortgage: v })}
                      min={1}
                      max={15}
                      step={0.25}
                      className="[&_[role=slider]]:bg-bloomberg-cyan [&_[role=slider]]:border-0 [&_.slider-ghost]:bg-bloomberg-cyan"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1 font-mono">
                      <span>1%</span>
                      <span>8%</span>
                      <span>15%</span>
                    </div>
                  </div>

                  {/* Auto */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-bloomberg-cyan text-sm uppercase font-semibold">
                        Auto Loan
                        {marketData?.rates.auto && (
                          <span className="text-xs text-muted-foreground ml-2 normal-case">
                            Market: {(marketData.rates.auto * 100).toFixed(2)}%
                          </span>
                        )}
                      </span>
                      <span className="text-xl font-bold font-mono tabular-nums">
                        {rates.auto.toFixed(2)}%
                      </span>
                    </div>
                    <Slider
                      value={[rates.auto]}
                      onValueChange={([v]) => setRates({ ...rates, auto: v })}
                      min={1}
                      max={20}
                      step={0.25}
                      className="[&_[role=slider]]:bg-bloomberg-cyan [&_[role=slider]]:border-0 [&_.slider-ghost]:bg-bloomberg-cyan"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1 font-mono">
                      <span>1%</span>
                      <span>10%</span>
                      <span>20%</span>
                    </div>
                  </div>

                  {/* Personal */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-bloomberg-cyan text-sm uppercase font-semibold">
                        Personal Loan
                        {marketData?.rates.personal && (
                          <span className="text-xs text-muted-foreground ml-2 normal-case">
                            Market: {(marketData.rates.personal * 100).toFixed(2)}%
                          </span>
                        )}
                      </span>
                      <span className="text-xl font-bold font-mono tabular-nums">
                        {rates.personal.toFixed(2)}%
                      </span>
                    </div>
                    <Slider
                      value={[rates.personal]}
                      onValueChange={([v]) => setRates({ ...rates, personal: v })}
                      min={5}
                      max={30}
                      step={0.25}
                      className="[&_[role=slider]]:bg-bloomberg-cyan [&_[role=slider]]:border-0 [&_.slider-ghost]:bg-bloomberg-cyan"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1 font-mono">
                      <span>5%</span>
                      <span>15%</span>
                      <span>30%</span>
                    </div>
                  </div>

                  {/* Credit Card */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-bloomberg-cyan text-sm uppercase font-semibold">
                        Credit Card
                        {marketData?.rates.credit_card && (
                          <span className="text-xs text-muted-foreground ml-2 normal-case">
                            Market: {(marketData.rates.credit_card * 100).toFixed(2)}%
                          </span>
                        )}
                      </span>
                      <span className="text-xl font-bold font-mono tabular-nums">
                        {rates.credit_card.toFixed(2)}%
                      </span>
                    </div>
                    <Slider
                      value={[rates.credit_card]}
                      onValueChange={([v]) => setRates({ ...rates, credit_card: v })}
                      min={10}
                      max={40}
                      step={0.25}
                      className="[&_[role=slider]]:bg-bloomberg-cyan [&_[role=slider]]:border-0 [&_.slider-ghost]:bg-bloomberg-cyan"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1 font-mono">
                      <span>10%</span>
                      <span>25%</span>
                      <span>40%</span>
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel title="Deposit Product Rates" headerColor="green">
                <div className="space-y-6 p-2">
                  {/* Savings */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-bloomberg-cyan text-sm uppercase font-semibold">
                        <PiggyBank className="h-4 w-4 inline mr-2" />
                        Savings Account
                        {marketData?.rates.savings && (
                          <span className="text-xs text-muted-foreground ml-2 normal-case">
                            Market: {(marketData.rates.savings * 100).toFixed(2)}%
                          </span>
                        )}
                      </span>
                      <span className="text-xl font-bold font-mono tabular-nums">
                        {rates.savings.toFixed(2)}%
                      </span>
                    </div>
                    <Slider
                      value={[rates.savings]}
                      onValueChange={([v]) => setRates({ ...rates, savings: v })}
                      min={0}
                      max={10}
                      step={0.25}
                      className="[&_[role=slider]]:bg-bloomberg-green [&_[role=slider]]:border-0 [&_.slider-ghost]:bg-bloomberg-green"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1 font-mono">
                      <span>0%</span>
                      <span>5%</span>
                      <span>10%</span>
                    </div>
                  </div>

                  {/* CD */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-bloomberg-cyan text-sm uppercase font-semibold">
                        Certificate of Deposit (CD)
                        {marketData?.rates.cd && (
                          <span className="text-xs text-muted-foreground ml-2 normal-case">
                            Market: {(marketData.rates.cd * 100).toFixed(2)}%
                          </span>
                        )}
                      </span>
                      <span className="text-xl font-bold font-mono tabular-nums">
                        {rates.cd.toFixed(2)}%
                      </span>
                    </div>
                    <Slider
                      value={[rates.cd]}
                      onValueChange={([v]) => setRates({ ...rates, cd: v })}
                      min={0}
                      max={10}
                      step={0.25}
                      className="[&_[role=slider]]:bg-bloomberg-green [&_[role=slider]]:border-0 [&_.slider-ghost]:bg-bloomberg-green"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1 font-mono">
                      <span>0%</span>
                      <span>5%</span>
                      <span>10%</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleApplyRates}
                    className="w-full bg-bloomberg-blue hover:bg-bloomberg-blue/80 text-black font-bold uppercase"
                  >
                    Apply Rate Changes
                  </Button>
                </div>
              </Panel>

              <Panel title="Rate Impact Analysis" headerColor="amber">
                <div className="grid grid-cols-2 gap-4">
                  <StatCard
                    label="Avg Lending Rate"
                    value={avgLendingRate}
                    format="percent"
                    size="sm"
                  />
                  <StatCard
                    label="Savings Rate"
                    value={rates.savings}
                    format="percent"
                    size="sm"
                  />
                  <StatCard
                    label="Interest Spread"
                    value={avgLendingRate - rates.savings}
                    format="percent"
                    trend={avgLendingRate - rates.savings > 3 ? "up" : "down"}
                    size="sm"
                  />
                  <StatCard
                    label="Est. NIM"
                    value={nim}
                    format="percent"
                    size="sm"
                  />
                </div>
              </Panel>
            </div>
          </TabsContent>

          <TabsContent value="portfolio" className="flex-1 m-0 overflow-auto">
            <Tabs defaultValue="by-product" className="h-full flex flex-col">
              <div className="border-b border-border bg-secondary px-2">
                <TabsList className="bg-transparent border-0 h-auto p-0">
                  <TabsTrigger
                    value="by-product"
                    className="data-[state=active]:bg-transparent data-[state=active]:text-bloomberg-amber data-[state=active]:border-b-2 data-[state=active]:border-bloomberg-amber rounded-none px-4 py-2 text-sm font-mono uppercase"
                  >
                    By Product
                  </TabsTrigger>
                  <TabsTrigger
                    value="by-risk"
                    className="data-[state=active]:bg-transparent data-[state=active]:text-bloomberg-amber data-[state=active]:border-b-2 data-[state=active]:border-bloomberg-amber rounded-none px-4 py-2 text-sm font-mono uppercase"
                  >
                    By Risk Class
                  </TabsTrigger>
                  <TabsTrigger
                    value="deposits"
                    className="data-[state=active]:bg-transparent data-[state=active]:text-bloomberg-amber data-[state=active]:border-b-2 data-[state=active]:border-bloomberg-amber rounded-none px-4 py-2 text-sm font-mono uppercase"
                  >
                    Deposits
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="by-product" className="flex-1 m-0 overflow-auto">
                <div className="p-4 space-y-4">
                  <Panel title={`PORTFOLIO BY PRODUCT — Total: ${formatCurrency(bank.currentLoans)}`} headerColor="cyan">
                    {productDistribution.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No loans in portfolio
                      </div>
                    ) : (
                      <>
                        <DataGrid>
                          <DataGridHeader>
                            <tr>
                              <DataGridHead>Product</DataGridHead>
                              <DataGridHead className="text-right">Balance</DataGridHead>
                              <DataGridHead className="text-right">Loans</DataGridHead>
                              <DataGridHead className="text-right">% Portfolio</DataGridHead>
                              <DataGridHead className="text-right">Avg Rate</DataGridHead>
                              <DataGridHead className="text-right">Default Rate</DataGridHead>
                            </tr>
                          </DataGridHeader>
                          <DataGridBody>
                            {productDistribution.map((item) => (
                              <DataGridRow key={item.product}>
                                <DataGridCell variant="highlight">
                                  {formatProduct(item.product)}
                                </DataGridCell>
                                <DataGridCell numeric>
                                  {formatCurrency(item.balance)}
                                </DataGridCell>
                                <DataGridCell numeric>
                                  {item.activeLoanCount.toLocaleString()} / {item.loanCount.toLocaleString()}
                                </DataGridCell>
                                <DataGridCell numeric>
                                  {formatPercent(item.percentage)}
                                </DataGridCell>
                                <DataGridCell numeric>
                                  {formatPercent(item.avgRate * 100)}
                                </DataGridCell>
                                <DataGridCell
                                  numeric
                                  variant={item.defaultRate > HIGH_DEFAULT_RATE_THRESHOLD ? "negative" : item.defaultRate >= MEDIUM_DEFAULT_RATE_THRESHOLD ? "warning" : "positive"}
                                >
                                  {formatPercent(item.defaultRate)}
                                  {item.defaultRate > HIGH_DEFAULT_RATE_THRESHOLD && " ⚠"}
                                  {item.defaultRate <= LOW_DEFAULT_RATE_THRESHOLD && " ✓"}
                                </DataGridCell>
                              </DataGridRow>
                            ))}
                            <DataGridRow>
                              <DataGridCell variant="highlight" className="font-bold">
                                TOTAL
                              </DataGridCell>
                              <DataGridCell numeric className="font-bold">
                                {formatCurrency(bank.currentLoans)}
                              </DataGridCell>
                              <DataGridCell numeric className="font-bold">
                                {loanTotals.activeLoanCount.toLocaleString()} / {loanTotals.loanCount.toLocaleString()}
                              </DataGridCell>
                              <DataGridCell numeric className="font-bold">
                                100.00%
                              </DataGridCell>
                              <DataGridCell numeric>—</DataGridCell>
                              <DataGridCell numeric className="font-bold">
                                {formatPercent(loanTotals.defaultRate)}
                              </DataGridCell>
                            </DataGridRow>
                          </DataGridBody>
                        </DataGrid>

                        <div className="mt-6">
                          <div className="text-xs uppercase text-bloomberg-cyan mb-2 font-bold">
                            Portfolio Composition
                          </div>
                          <div className="space-y-2">
                            {productDistribution.map((item) => (
                              <div key={item.product} className="flex items-center gap-2">
                                <div className="w-32 text-sm font-mono">
                                  {formatProduct(item.product)}
                                </div>
                                <div className="flex-1 bg-secondary h-4 relative">
                                  <div
                                    className="h-full bg-bloomberg-cyan"
                                    style={{ width: `${item.percentage}%` }}
                                  />
                                </div>
                                <div className="w-16 text-right text-sm font-mono tabular-nums">
                                  {formatPercent(item.percentage)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </Panel>
                </div>
              </TabsContent>

              <TabsContent value="by-risk" className="flex-1 m-0 overflow-auto">
                <div className="p-4 space-y-4">
                  <Panel title={`PORTFOLIO BY RISK CLASS — Total: ${formatCurrency(bank.currentLoans)}`} headerColor="amber">
                    {riskDistribution.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No loans in portfolio
                      </div>
                    ) : (
                      <>
                        <DataGrid>
                          <DataGridHeader>
                            <tr>
                              <DataGridHead>Risk Class</DataGridHead>
                              <DataGridHead className="text-right">Balance</DataGridHead>
                              <DataGridHead className="text-right">Loans</DataGridHead>
                              <DataGridHead className="text-right">% Portfolio</DataGridHead>
                              <DataGridHead className="text-right">Avg Rate</DataGridHead>
                              <DataGridHead className="text-right">Default Rate</DataGridHead>
                            </tr>
                          </DataGridHeader>
                          <DataGridBody>
                            {riskDistribution.map((item) => (
                              <DataGridRow key={item.riskClass}>
                                <DataGridCell variant="highlight">
                                  {formatRiskClass(item.riskClass)}
                                </DataGridCell>
                                <DataGridCell numeric>
                                  {formatCurrency(item.balance)}
                                </DataGridCell>
                                <DataGridCell numeric>
                                  {item.activeLoanCount.toLocaleString()} / {item.loanCount.toLocaleString()}
                                </DataGridCell>
                                <DataGridCell numeric>
                                  {formatPercent(item.percentage)}
                                </DataGridCell>
                                <DataGridCell numeric>
                                  {formatPercent(item.avgRate * 100)}
                                </DataGridCell>
                                <DataGridCell
                                  numeric
                                  variant={item.defaultRate > HIGH_DEFAULT_RATE_THRESHOLD ? "negative" : item.defaultRate >= MEDIUM_DEFAULT_RATE_THRESHOLD ? "warning" : "positive"}
                                >
                                  {formatPercent(item.defaultRate)}
                                  {item.defaultRate > HIGH_DEFAULT_RATE_THRESHOLD && " ⚠"}
                                  {item.defaultRate <= LOW_DEFAULT_RATE_THRESHOLD && " ✓"}
                                </DataGridCell>
                              </DataGridRow>
                            ))}
                            <DataGridRow>
                              <DataGridCell variant="highlight" className="font-bold">
                                TOTAL
                              </DataGridCell>
                              <DataGridCell numeric className="font-bold">
                                {formatCurrency(bank.currentLoans)}
                              </DataGridCell>
                              <DataGridCell numeric className="font-bold">
                                {loanTotals.activeLoanCount.toLocaleString()} / {loanTotals.loanCount.toLocaleString()}
                              </DataGridCell>
                              <DataGridCell numeric className="font-bold">
                                100.00%
                              </DataGridCell>
                              <DataGridCell numeric>—</DataGridCell>
                              <DataGridCell numeric className="font-bold">
                                {formatPercent(loanTotals.defaultRate)}
                              </DataGridCell>
                            </DataGridRow>
                          </DataGridBody>
                        </DataGrid>

                        <div className="mt-6">
                          <div className="text-xs uppercase text-bloomberg-amber mb-2 font-bold">
                            Risk Composition
                          </div>
                          <div className="space-y-2">
                            {riskDistribution.map((item) => (
                              <div key={item.riskClass} className="flex items-center gap-2">
                                <div className="w-32 text-sm font-mono">
                                  {formatRiskClass(item.riskClass)}
                                </div>
                                <div className="flex-1 bg-secondary h-4 relative">
                                  <div
                                    className="h-full bg-bloomberg-amber"
                                    style={{ width: `${item.percentage}%` }}
                                  />
                                </div>
                                <div className="w-16 text-right text-sm font-mono tabular-nums">
                                  {formatPercent(item.percentage)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </Panel>
                </div>
              </TabsContent>

              <TabsContent value="deposits" className="flex-1 m-0 overflow-auto">
                <div className="p-4 space-y-4">
                  <Panel title={`DEPOSITS — Total: ${formatCurrency(depositTotals.balance)}`} headerColor="green">
                    {depositDistribution.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No deposits in portfolio
                      </div>
                    ) : (
                      <>
                        <DataGrid>
                          <DataGridHeader>
                            <tr>
                              <DataGridHead>Product</DataGridHead>
                              <DataGridHead className="text-right">Balance</DataGridHead>
                              <DataGridHead className="text-right">% of Deposits</DataGridHead>
                              <DataGridHead className="text-right">Avg Rate</DataGridHead>
                              <DataGridHead className="text-right">Bucket Count</DataGridHead>
                            </tr>
                          </DataGridHeader>
                          <DataGridBody>
                            {depositDistribution.map((item) => (
                              <DataGridRow key={item.product}>
                                <DataGridCell variant="highlight">
                                  {formatProduct(item.product)}
                                </DataGridCell>
                                <DataGridCell numeric>
                                  {formatCurrency(item.balance)}
                                </DataGridCell>
                                <DataGridCell numeric>
                                  {formatPercent(item.percentage)}
                                </DataGridCell>
                                <DataGridCell numeric>
                                  {formatPercent(item.avgRate * 100)}
                                </DataGridCell>
                                <DataGridCell numeric>
                                  {item.bucketCount}
                                </DataGridCell>
                              </DataGridRow>
                            ))}
                            <DataGridRow>
                              <DataGridCell variant="highlight" className="font-bold">
                                TOTAL
                              </DataGridCell>
                              <DataGridCell numeric className="font-bold">
                                {formatCurrency(depositTotals.balance)}
                              </DataGridCell>
                              <DataGridCell numeric className="font-bold">
                                100.00%
                              </DataGridCell>
                              <DataGridCell numeric>—</DataGridCell>
                              <DataGridCell numeric>
                                {depositTotals.bucketCount}
                              </DataGridCell>
                            </DataGridRow>
                          </DataGridBody>
                        </DataGrid>

                        <div className="mt-6">
                          <div className="text-xs uppercase text-bloomberg-green mb-2 font-bold">
                            Deposit Composition
                          </div>
                          <div className="space-y-2">
                            {depositDistribution.map((item) => (
                              <div key={item.product} className="flex items-center gap-2">
                                <div className="w-32 text-sm font-mono">
                                  {formatProduct(item.product)}
                                </div>
                                <div className="flex-1 bg-secondary h-4 relative">
                                  <div
                                    className="h-full bg-bloomberg-green"
                                    style={{ width: `${item.percentage}%` }}
                                  />
                                </div>
                                <div className="w-16 text-right text-sm font-mono tabular-nums">
                                  {formatPercent(item.percentage)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </Panel>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
          <TabsContent value="ledger" className="flex-1 m-0 overflow-auto">
            <div className="p-4 space-y-4">
              {/* Summary bar */}
              {txnData?.summary && txnData.summary.length > 0 && (
                <div className="grid grid-cols-3 gap-px bg-border">
                  <StatCard
                    label="Total Inflows"
                    value={txnData.summary
                      .filter((s) => s.total > 0)
                      .reduce((sum, s) => sum + s.total, 0)}
                    format="currency"
                    prefix="$"
                    size="sm"
                  />
                  <StatCard
                    label="Total Outflows"
                    value={Math.abs(
                      txnData.summary
                        .filter((s) => s.total < 0)
                        .reduce((sum, s) => sum + s.total, 0),
                    )}
                    format="currency"
                    prefix="$"
                    size="sm"
                  />
                  <StatCard
                    label="Total Transactions"
                    value={txnData.pagination.total}
                    format="number"
                    size="sm"
                  />
                </div>
              )}

              {/* Summary by type */}
              {txnData?.summary && txnData.summary.length > 0 && (
                <Panel title="SUMMARY BY TYPE" headerColor="amber">
                  <DataGrid>
                    <DataGridHeader>
                      <tr>
                        <DataGridHead>Type</DataGridHead>
                        <DataGridHead className="text-right">Count</DataGridHead>
                        <DataGridHead className="text-right">Total</DataGridHead>
                      </tr>
                    </DataGridHeader>
                    <DataGridBody>
                      {txnData.summary
                        .sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
                        .map((s) => (
                          <DataGridRow key={s.type}>
                            <DataGridCell variant="highlight">
                              {formatStringWithSeparator(s.type, ' ')}
                            </DataGridCell>
                            <DataGridCell numeric>{s.count}</DataGridCell>
                            <DataGridCell
                              numeric
                              variant={s.total > 0 ? "positive" : "negative"}
                            >
                              {s.total > 0 ? '+' : ''}{formatCurrency(s.total)}
                            </DataGridCell>
                          </DataGridRow>
                        ))}
                    </DataGridBody>
                  </DataGrid>
                </Panel>
              )}

              {/* Type filter */}
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase text-muted-foreground font-mono">
                  Filter by type:
                </span>
                <select
                  value={txnTypeFilter ?? ""}
                  onChange={(e) => {
                    setTxnTypeFilter(e.target.value || undefined);
                    setTxnPage(1);
                  }}
                  className="bg-secondary text-foreground text-xs font-mono border border-border px-2 py-1 rounded"
                >
                  <option value="">All Types</option>
                  <option value="loan_origination">Loan Origination</option>
                  <option value="deposit_inflow">Deposit Inflow</option>
                  <option value="interest_income">Interest Income</option>
                  <option value="interest_expense">Interest Expense</option>
                  <option value="loan_default">Loan Default</option>
                  <option value="operating_expense">Operating Expense</option>
                </select>
              </div>

              <Panel title="TRANSACTION LEDGER" headerColor="cyan">
                {isTxnLoading ? (
                  <div className="text-center py-8 text-muted-foreground font-mono">
                    Loading transactions...
                  </div>
                ) : !txnData || txnData.transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions found. Collect to generate transactions.
                  </div>
                ) : (
                  <>
                    <DataGrid>
                      <DataGridHeader>
                        <tr>
                          <DataGridHead>Timestamp</DataGridHead>
                          <DataGridHead>Type</DataGridHead>
                          <DataGridHead className="text-right">Count</DataGridHead>
                          <DataGridHead className="text-right">Amount</DataGridHead>
                        </tr>
                      </DataGridHeader>
                      <DataGridBody>
                        {groupedTransactions.map((row) => (
                          <DataGridRow key={row.key}>
                            <DataGridCell>
                              {new Date(row.timestamp).toLocaleString()}
                            </DataGridCell>
                            <DataGridCell variant="highlight">
                              {formatStringWithSeparator(row.type, ' ')}
                            </DataGridCell>
                            <DataGridCell numeric>
                              {row.count > 1 ? row.count : ''}
                            </DataGridCell>
                            <DataGridCell
                              numeric
                              variant={row.amount > 0 ? "positive" : "negative"}
                            >
                              {row.amount > 0 ? '+' : ''}{formatCurrency(row.amount)}
                            </DataGridCell>
                          </DataGridRow>
                        ))}
                      </DataGridBody>
                    </DataGrid>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4 px-2">
                      <span className="text-xs text-muted-foreground font-mono">
                        Page {txnData.pagination.page} of {txnData.pagination.totalPages}
                        {' '}({txnData.pagination.total} total)
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={txnPage <= 1}
                          onClick={() => setTxnPage((p) => p - 1)}
                          className="font-mono text-xs"
                        >
                          Prev
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={txnPage >= txnData.pagination.totalPages}
                          onClick={() => setTxnPage((p) => p + 1)}
                          className="font-mono text-xs"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </Panel>
            </div>
          </TabsContent>
        </Tabs>
      </BloombergMain>
    </BloombergLayout>
  );
}
