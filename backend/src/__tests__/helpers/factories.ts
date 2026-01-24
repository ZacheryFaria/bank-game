export function createTestUser(overrides?: {
  email?: string;
  password?: string;
  bankName?: string;
}) {
  return {
    email: overrides?.email || `test-${Date.now()}@example.com`,
    password: overrides?.password || "password123",
    bankName: overrides?.bankName || "Test Bank",
  };
}

export function createAuthHeader(token: string) {
  return {
    authorization: `Bearer ${token}`,
  };
}
