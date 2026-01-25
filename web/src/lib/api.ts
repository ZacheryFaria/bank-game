import { initClient } from "@ts-rest/core";
import { contract } from "@bank-game/shared";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const apiClient = initClient(contract, {
  baseUrl: API_BASE_URL,
  baseHeaders: {},
  api: async (args) => {
    const token = localStorage.getItem("token");

    const headers: Record<string, string> = {
      ...args.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let body: string | undefined;
    if (args.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(args.body);
    }

    const response = await fetch(args.path, {
      method: args.method,
      headers,
      body,
    });

    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    return {
      status: response.status,
      body: isJson ? await response.json() : await response.text(),
      headers: response.headers,
    };
  },
});
