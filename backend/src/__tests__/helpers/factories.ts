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

export function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

export function secondsAgo(seconds: number): Date {
  return new Date(Date.now() - seconds * 1000);
}

export function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60 * 1000);
}
