import { initClient } from "@ts-rest/core";
import { initQueryClient } from "@ts-rest/react-query";
import { contract } from "@bank-game/shared";

const API_BASE_URL = process.env.API_URL || "http://localhost:3001";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export const client = initClient(contract, {
  baseUrl: API_BASE_URL,
  baseHeaders: {
    "Content-Type": "application/json",
    Authorization: () => authToken ? `Bearer ${authToken}` : "",
  },
});

export const tsRestClient = initQueryClient(contract, {
  baseUrl: API_BASE_URL,
  baseHeaders: {
    "Content-Type": "application/json",
    Authorization: () => authToken ? `Bearer ${authToken}` : "",
  },
});
