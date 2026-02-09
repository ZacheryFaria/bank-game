import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

interface UseFinancialsOptions {
  bankId: string;
  limit?: number;
}

export function useFinancials({ bankId, limit }: UseFinancialsOptions) {
  return useQuery({
    queryKey: ["financials", bankId, limit],
    queryFn: async () => {
      const response = await apiClient.banks.getFinancials({
        params: { id: bankId },
        query: { limit },
      });
      if (response.status !== 200) {
        throw new Error("Failed to fetch financials");
      }
      return response.body.snapshots;
    },
    enabled: !!bankId,
  });
}
