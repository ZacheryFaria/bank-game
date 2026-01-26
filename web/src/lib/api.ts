import { initClient } from "@ts-rest/core";
import { contract } from "@bank-game/shared";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const apiClient = initClient(contract, {
  baseUrl: API_BASE_URL,
  baseHeaders: {
    Authorization: () => {
      const token = localStorage.getItem("token");
      return token ? `Bearer ${token}` : "";
    },
  },
});
