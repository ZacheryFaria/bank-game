import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

interface UsePortfolioHistoryOptions {
  period?: "7d" | "30d" | "90d" | "1y" | "all";
  product?: string;
  riskClass?: string;
}

export function usePortfolioHistory(options: UsePortfolioHistoryOptions = {}) {
  const { period = "30d", product, riskClass } = options;

  return useQuery({
    queryKey: ["portfolio-history", period, product, riskClass],
    queryFn: async () => {
      const response = await apiClient.bank.portfolioHistory({
        query: { period, product, riskClass, granularity: "quarterly" },
      });
      if (response.status !== 200) {
        throw new Error("Failed to fetch portfolio history");
      }
      return response.body;
    },
  });
}
