import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBank } from "@/hooks/useBank";
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
} from "@/components/bloomberg";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Building2, DollarSign, Clock, LogOut, PiggyBank, TrendingUp } from "lucide-react";
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
  return formatStringWithSeparator(product, ' ');
};

type ProductDistribution = {
  product: string;
  balance: number;
  percentage: number;
  avgRate: number;
  loanCount: number;
  activeLoanCount: number;
};

type RiskDistribution = {
  riskClass: string;
  balance: number;
  percentage: number;
  avgRate: number;
  loanCount: number;
  activeLoanCount: number;
  defaultRate: number;
};

export function Dashboard() {
  const { user, logout } = useAuth();
  const { bank, isLoading, collect, isCollecting, updateRates } = useBank();

  const [depositRate, setDepositRate] = useState<number[]>([2.5]);
  const [lendingRate, setLendingRate] = useState<number[]>([7.5]);

  const { productDistribution, riskDistribution } = useMemo<{
    productDistribution: ProductDistribution[];
    riskDistribution: RiskDistribution[];
  }>(() => {
    if (!bank?.loanBuckets || bank.loanBuckets.length === 0) {
      return { productDistribution: [], riskDistribution: [] };
    }

    const byProduct = new Map<string, {
      balance: number;
      weightedRate: number;
      loanCount: number;
      activeLoanCount: number;
    }>();

    const byRisk = new Map<string, {
      balance: number;
      weightedRate: number;
      loanCount: number;
      activeLoanCount: number;
    }>();

    for (const bucket of bank.loanBuckets) {
      const existingProduct = byProduct.get(bucket.product) || {
        balance: 0,
        weightedRate: 0,
        loanCount: 0,
        activeLoanCount: 0,
      };

      byProduct.set(bucket.product, {
        balance: existingProduct.balance + bucket.currentBalance,
        weightedRate: existingProduct.weightedRate + (bucket.currentBalance * bucket.interestRate),
        loanCount: existingProduct.loanCount + bucket.loanCount,
        activeLoanCount: existingProduct.activeLoanCount + bucket.activeLoanCount,
      });

      const existingRisk = byRisk.get(bucket.riskClass) || {
        balance: 0,
        weightedRate: 0,
        loanCount: 0,
        activeLoanCount: 0,
      };

      byRisk.set(bucket.riskClass, {
        balance: existingRisk.balance + bucket.currentBalance,
        weightedRate: existingRisk.weightedRate + (bucket.currentBalance * bucket.interestRate),
        loanCount: existingRisk.loanCount + bucket.loanCount,
        activeLoanCount: existingRisk.activeLoanCount + bucket.activeLoanCount,
      });
    }

    const totalLoans = bank.currentLoans;

    const productDist = Array.from(byProduct.entries()).map(([product, data]) => ({
      product,
      balance: data.balance,
      percentage: totalLoans > 0 ? (data.balance / totalLoans) * 100 : 0,
      avgRate: data.balance > 0 ? data.weightedRate / data.balance : 0,
      loanCount: data.loanCount,
      activeLoanCount: data.activeLoanCount,
    })).sort((a, b) => b.balance - a.balance);

    const riskOrder = ['super_prime', 'prime', 'near_prime', 'subprime'];

    const riskDist = Array.from(byRisk.entries()).map(([riskClass, data]) => {
      const defaultCount = data.loanCount - data.activeLoanCount;
      const defaultRate = data.loanCount > 0 ? (defaultCount / data.loanCount) * 100 : 0;

      return {
        riskClass,
        balance: data.balance,
        percentage: totalLoans > 0 ? (data.balance / totalLoans) * 100 : 0,
        avgRate: data.balance > 0 ? data.weightedRate / data.balance : 0,
        loanCount: data.loanCount,
        activeLoanCount: data.activeLoanCount,
        defaultRate,
      };
    }).sort((a, b) => {
      const aIndex = riskOrder.indexOf(a.riskClass);
      const bIndex = riskOrder.indexOf(b.riskClass);
      return (aIndex === -1 ? Infinity : aIndex) - (bIndex === -1 ? Infinity : bIndex);
    });

    return { productDistribution: productDist, riskDistribution: riskDist };
  }, [bank]);

  const productTotals = useMemo(() => {
    return {
      activeLoanCount: productDistribution.reduce((sum, item) => sum + item.activeLoanCount, 0),
      loanCount: productDistribution.reduce((sum, item) => sum + item.loanCount, 0),
    };
  }, [productDistribution]);

  const riskTotals = useMemo(() => {
    const totalDefaults = riskDistribution.reduce((sum, item) => sum + (item.loanCount - item.activeLoanCount), 0);
    const totalLoans = riskDistribution.reduce((sum, item) => sum + item.loanCount, 0);
    return {
      activeLoanCount: riskDistribution.reduce((sum, item) => sum + item.activeLoanCount, 0),
      loanCount: totalLoans,
      defaultRate: totalLoans > 0 ? (totalDefaults / totalLoans) * 100 : 0,
    };
  }, [riskDistribution]);

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

  const handleCollect = () => {
    collect();
  };

  const handleApplyRates = () => {
    updateRates({
      savings: depositRate[0] / 100,
      lending: lendingRate[0] / 100,
    });
  };

  const nim = bank.currentLoans > 0 && lendingRate[0] > 0
    ? ((lendingRate[0] - depositRate[0]) / lendingRate[0]) * 100
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
        <Tabs defaultValue="overview" className="h-full flex flex-col">
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
            </TabsList>
          </div>

          <TabsContent value="overview" className="flex-1 m-0 overflow-auto">
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-px bg-border">
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
            </div>
          </TabsContent>

          <TabsContent value="rates" className="flex-1 m-0 overflow-auto">
            <div className="p-4 space-y-6">
              <Panel title="Interest Rate Controls" headerColor="blue">
                <div className="space-y-6 p-2">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-bloomberg-cyan text-sm uppercase font-semibold">
                        <PiggyBank className="h-4 w-4 inline mr-2" />
                        Deposit Rate
                      </span>
                      <span className="text-xl font-bold font-mono tabular-nums">
                        {depositRate[0].toFixed(2)}%
                      </span>
                    </div>
                    <Slider
                      value={depositRate}
                      onValueChange={setDepositRate}
                      min={0}
                      max={10}
                      step={0.25}
                      className="[&_[role=slider]]:bg-bloomberg-cyan [&_[role=slider]]:border-0 [&_.slider-ghost]:bg-bloomberg-cyan"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1 font-mono">
                      <span>0%</span>
                      <span>5%</span>
                      <span>10%</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-bloomberg-cyan text-sm uppercase font-semibold">
                        <TrendingUp className="h-4 w-4 inline mr-2" />
                        Lending Rate
                      </span>
                      <span className="text-xl font-bold font-mono tabular-nums">
                        {lendingRate[0].toFixed(2)}%
                      </span>
                    </div>
                    <Slider
                      value={lendingRate}
                      onValueChange={setLendingRate}
                      min={0}
                      max={20}
                      step={0.25}
                      className="[&_[role=slider]]:bg-bloomberg-orange [&_[role=slider]]:border-0 [&_.slider-ghost]:bg-bloomberg-orange"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1 font-mono">
                      <span>0%</span>
                      <span>10%</span>
                      <span>20%</span>
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
                    label="Interest Spread"
                    value={lendingRate[0] - depositRate[0]}
                    format="percent"
                    trend={lendingRate[0] - depositRate[0] > 3 ? "up" : "down"}
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
                              <DataGridHead>Balance</DataGridHead>
                              <DataGridHead>% Portfolio</DataGridHead>
                              <DataGridHead>Avg Rate</DataGridHead>
                              <DataGridHead>Loan Count</DataGridHead>
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
                                  {formatPercent(item.percentage)}
                                </DataGridCell>
                                <DataGridCell numeric>
                                  {formatPercent(item.avgRate * 100)}
                                </DataGridCell>
                                <DataGridCell numeric>
                                  {item.activeLoanCount} / {item.loanCount}
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
                                100.00%
                              </DataGridCell>
                              <DataGridCell numeric>—</DataGridCell>
                              <DataGridCell numeric>
                                {productTotals.activeLoanCount} / {productTotals.loanCount}
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
                              <DataGridHead>Balance</DataGridHead>
                              <DataGridHead>% Portfolio</DataGridHead>
                              <DataGridHead>Avg Rate</DataGridHead>
                              <DataGridHead>Default Rate</DataGridHead>
                              <DataGridHead>Loan Count</DataGridHead>
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
                                  {formatPercent(item.percentage)}
                                </DataGridCell>
                                <DataGridCell numeric>
                                  {formatPercent(item.avgRate * 100)}
                                </DataGridCell>
                                <DataGridCell
                                  numeric
                                  variant={item.defaultRate > 5 ? "negative" : item.defaultRate > 2 ? "muted" : "positive"}
                                >
                                  {formatPercent(item.defaultRate)}
                                  {item.defaultRate > 5 && " ⚠"}
                                  {item.defaultRate <= 1 && " ✓"}
                                </DataGridCell>
                                <DataGridCell numeric>
                                  {item.activeLoanCount} / {item.loanCount}
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
                                100.00%
                              </DataGridCell>
                              <DataGridCell numeric>—</DataGridCell>
                              <DataGridCell numeric>
                                {formatPercent(riskTotals.defaultRate)}
                              </DataGridCell>
                              <DataGridCell numeric>
                                {riskTotals.activeLoanCount} / {riskTotals.loanCount}
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
            </Tabs>
          </TabsContent>
        </Tabs>
      </BloombergMain>
    </BloombergLayout>
  );
}
