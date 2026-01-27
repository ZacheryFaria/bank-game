import { useState } from "react";
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
} from "@/components/bloomberg";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Building2, DollarSign, Clock, LogOut, PiggyBank, TrendingUp } from "lucide-react";

export function Dashboard() {
  const { user, logout } = useAuth();
  const { bank, isLoading, collect, isCollecting, updateRates } = useBank();

  const [depositRate, setDepositRate] = useState<number[]>([2.5]);
  const [lendingRate, setLendingRate] = useState<number[]>([7.5]);

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
                    {bank.rates?.map((rate: any) => (
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
                    {bank.allocations?.map((allocation: any) => (
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
        </Tabs>
      </BloombergMain>
    </BloombergLayout>
  );
}
