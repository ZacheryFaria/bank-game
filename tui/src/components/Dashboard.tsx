import React from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { tsRestClient } from "../lib/api.js";
import { useKeyBindings } from "../hooks/useKeyBindings.js";
import { StatusBar } from "./ui/StatusBar.js";
import { Screen } from "./ui/Screen.js";
import { Section } from "./ui/Section.js";
import type { BankRate } from "@bank-game/shared";

const queryClient = new QueryClient();

function DashboardInner() {
  const queryClientInstance = useQueryClient();

  const { data: bank, isLoading, error, refetch } = useQuery({
    queryKey: ["bank"],
    queryFn: async () => {
      const result = await tsRestClient.bank.get.query();
      if (result.status === 200) {
        return result.body;
      }
      throw new Error("Failed to fetch bank");
    },
    refetchInterval: 10000,
  });

  const collectMutation = useMutation({
    mutationFn: async () => {
      const result = await tsRestClient.bank.collect.mutation({ body: null });
      if (result.status === 200) {
        return result.body;
      } else if (result.status === 429) {
        throw new Error(`Too soon! Wait ${result.body.retryAfter}s`);
      }
      throw new Error("Collection failed");
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ["bank"] });
    },
  });

  useKeyBindings("dashboard", (action) => {
    if (action.type === "collect") {
      collectMutation.mutate();
    }
    if (action.type === "refresh") {
      queryClientInstance.invalidateQueries({ queryKey: ["bank"] });
    }
  });

  if (isLoading) {
    return (
      <Box>
        <Text color="green">
          <Spinner type="dots" />
        </Text>
        <Text> Loading bank data...</Text>
      </Box>
    );
  }

  if (error || !bank) {
    return (
      <Box flexDirection="column">
        <Text color="red">❌ Failed to load bank data</Text>
        <Text dimColor>Press Ctrl+C to exit</Text>
      </Box>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (rate: number) => {
    return (rate * 100).toFixed(2) + "%";
  };

  const timeSinceCollection = new Date().getTime() - new Date(bank.lastCollectedAt).getTime();
  const minutesSince = Math.floor(timeSinceCollection / 60000);

  return (
    <Screen title={bank.name} icon="🏦">
      <Section title="💰 Financials">
        <Text>Equity: <Text color="green">{formatCurrency(bank.currentEquity)}</Text></Text>
        <Text>Loans: <Text color="yellow">{formatCurrency(bank.currentLoans)}</Text></Text>
        <Text>Deposits: <Text color="blue">{formatCurrency(bank.currentDeposits)}</Text></Text>
        <Text>Total Assets: <Text color="cyan">{formatCurrency(bank.currentEquity + bank.currentLoans)}</Text></Text>
      </Section>

      <Text> </Text>

      {bank.rates && bank.rates.length > 0 && (
        <>
          <Section title="📊 Interest Rates">
            {bank.rates.map((rate: BankRate) => (
              <Text key={rate.product}>
                {rate.product}: {formatPercent(rate.rate)}
              </Text>
            ))}
          </Section>
          <Text> </Text>
        </>
      )}

      <Section title="⏰ Collection">
        <Text>Last collected: {minutesSince} minute{minutesSince !== 1 ? "s" : ""} ago</Text>
        <Box height={1}>
          {collectMutation.isPending ? (
            <Text color="green">
              <Spinner type="dots" /> Collecting...
            </Text>
          ) : collectMutation.isError ? (
            <Text color="red">❌ {collectMutation.error?.message}</Text>
          ) : collectMutation.isSuccess ? (
            <Text color="green">✅ Collection successful!</Text>
          ) : null}
        </Box>
      </Section>

      <Text> </Text>
      <StatusBar
        items={[
          { key: "Ctrl+H", label: "Help" },
          { key: "Ctrl+L", label: "Collect" },
          { key: "Ctrl+R", label: "Refresh" },
          { key: "Ctrl+Q", label: "Logout" },
        ]}
      />
    </Screen>
  );
}

export function Dashboard() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardInner />
    </QueryClientProvider>
  );
}
