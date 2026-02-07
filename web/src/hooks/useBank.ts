import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";
import { BankSchema, CollectionReportSchema } from "@bank-game/shared";
import { z } from "zod";

type Bank = z.infer<typeof BankSchema>;
type CollectionReport = z.infer<typeof CollectionReportSchema>;

export function useBank() {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const bankQuery = useQuery({
    queryKey: ["bank"],
    queryFn: async () => {
      const response = await apiClient.bank.get();

      if (response.status === 401) {
        clearAuth();
        throw new Error("Session expired");
      }

      if (response.status !== 200) {
        const errorBody = response.body as { error?: string };
        throw new Error(errorBody.error || "Failed to fetch bank");
      }

      return response.body as Bank;
    },
  });

  const collectMutation = useMutation<CollectionReport, Error, void>({
    mutationFn: async () => {
      const response = await apiClient.bank.collect({
        body: {},
      });

      if (response.status === 429) {
        const rateLimitBody = response.body as { retryAfter?: number };
        const retryAfter = rateLimitBody.retryAfter || 60;
        throw new Error(`Rate limited. Try again in ${retryAfter} seconds`);
      }

      if (response.status !== 200) {
        const errorBody = response.body as { error?: string };
        throw new Error(errorBody.error || "Collection failed");
      }

      return response.body as CollectionReport;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bank"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-history"] });
      toast.success(`Collected! Net Income: $${data.netIncome.toFixed(2)}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Collection failed");
    },
  });

  const updateRatesMutation = useMutation({
    mutationFn: async (rates: Record<string, number>) => {
      const response = await apiClient.bank.updateRates({
        body: { rates },
      });

      if (response.status !== 200) {
        const errorBody = response.body as { error?: string };
        throw new Error(errorBody.error || "Failed to update rates");
      }

      return response.body as { success: boolean; rates: Array<{ product: string; rate: number }> };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank"] });
      toast.success("Rates updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update rates");
    },
  });

  const updateAllocationMutation = useMutation({
    mutationFn: async (allocations: Record<string, number>) => {
      const response = await apiClient.bank.updateAllocation({
        body: { allocations },
      });

      if (response.status !== 200) {
        const errorBody = response.body as { error?: string };
        throw new Error(errorBody.error || "Failed to update allocation");
      }

      return response.body as { success: boolean; allocations: Array<{ riskClass: string; percentage: number }> };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank"] });
      toast.success("Allocation updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update allocation");
    },
  });

  return {
    bank: bankQuery.data,
    isLoading: bankQuery.isLoading,
    isError: bankQuery.isError,
    error: bankQuery.error,
    collect: collectMutation.mutate,
    isCollecting: collectMutation.isPending,
    updateRates: updateRatesMutation.mutate,
    isUpdatingRates: updateRatesMutation.isPending,
    updateAllocation: updateAllocationMutation.mutate,
    isUpdatingAllocation: updateAllocationMutation.isPending,
  };
}
