import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { UserSchema } from "@bank-game/shared";
import { z } from "zod";

type User = z.infer<typeof UserSchema>;

export function useAuth() {
  const { setAuth, clearAuth, isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiClient.auth.login({
        body: data,
      });

      if (response.status !== 200) {
        const errorBody = response.body as { error?: string };
        throw new Error(errorBody.error || "Login failed");
      }

      return response.body as { token: string; refreshToken: string; user: User };
    },
    onSuccess: (data) => {
      setAuth(data.token, data.refreshToken, data.user);
      toast.success("Login successful");
      void navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Login failed");
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      bankName: string;
    }) => {
      const response = await apiClient.auth.register({
        body: data,
      });

      if (response.status !== 200) {
        const errorBody = response.body as { error?: string };
        throw new Error(errorBody.error || "Registration failed");
      }

      return response.body as { token: string; refreshToken: string; user: User };
    },
    onSuccess: (data) => {
      setAuth(data.token, data.refreshToken, data.user);
      toast.success("Registration successful");
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Registration failed");
    },
  });

  const logout = () => {
    clearAuth();
    queryClient.clear();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return {
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isAuthenticated: isAuthenticated(),
    user,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
}
