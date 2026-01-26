import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

export function useBank() {
  const queryClient = useQueryClient();

  const bankQuery = useQuery({
    queryKey: ["bank"],
    queryFn: async () => {
      const response = await apiClient.bank.get();

      if (response.status !== 200) {
        const errorBody = response.body as { error?: string };
        throw new Error(errorBody.error || "Failed to fetch bank");
      }

      return response.body as any;
    },
  });

  const collectMutation = useMutation({
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

      return response.body as any;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bank"] });
      toast.success(
        `Collected! Net Income: $${data.netIncome.toFixed(2)} (${data.gameQuartersElapsed} quarters)`
      );
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

      return response.body as any;
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

      return response.body as any;
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
