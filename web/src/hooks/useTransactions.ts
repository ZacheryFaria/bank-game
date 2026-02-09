import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

interface UseTransactionsOptions {
  type?: string;
  page?: number;
  limit?: number;
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const { type, page = 1, limit = 50 } = options;

  return useQuery({
    queryKey: ["transactions", type, page, limit],
    queryFn: async () => {
      const response = await apiClient.bank.transactions({
        query: { type, page, limit },
      });
      if (response.status !== 200) {
        throw new Error("Failed to fetch transactions");
      }
      return response.body;
    },
  });
}
