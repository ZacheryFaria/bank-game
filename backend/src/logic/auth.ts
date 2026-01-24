import prisma from "../lib/db.js";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  generateRefreshToken,
  hashRefreshToken,
  verifyRefreshToken,
  verifyRefreshTokenHash,
} from "../lib/auth.js";
import { STARTING_EQUITY, MARKET_RATES } from "../engine/constants.js";

export async function createUser(data: {
  email: string;
  password: string;
  bankName: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    return { success: false as const, error: "Email already registered" };
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      bank: {
        create: {
          name: data.bankName,
          currentEquity: STARTING_EQUITY,
          currentLoans: 0,
          currentDeposits: 0,
          rates: {
            createMany: {
              data: Object.entries(MARKET_RATES).map(([product, rate]) => ({
                product,
                rate,
              })),
            },
          },
          allocations: {
            createMany: {
              data: [
                { riskClass: "super_prime", percentage: 0.25 },
                { riskClass: "prime", percentage: 0.25 },
                { riskClass: "near_prime", percentage: 0.25 },
                { riskClass: "subprime", percentage: 0.25 },
              ],
            },
          },
        },
      },
    },
    include: {
      bank: true,
    },
  });

  const token = generateToken({
    userId: user.id,
    email: user.email,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
  });
  const refreshTokenHash = await hashRefreshToken(refreshToken);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash },
  });

  return {
    success: true as const,
    token,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      bank: user.bank,
    },
  };
}

export async function authenticateUser(data: {
  email: string;
  password: string;
}) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: {
      bank: true,
    },
  });

  if (!user) {
    return { success: false as const, error: "Invalid credentials" };
  }

  const valid = await verifyPassword(data.password, user.passwordHash);
  if (!valid) {
    return { success: false as const, error: "Invalid credentials" };
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
  });
  const refreshTokenHash = await hashRefreshToken(refreshToken);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash },
  });

  return {
    success: true as const,
    token,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      bank: user.bank,
    },
  };
}

export async function refreshUserToken(data: { refreshToken: string }) {
  const payload = verifyRefreshToken(data.refreshToken);
  if (!payload) {
    return {
      success: false as const,
      error: "Invalid or expired refresh token",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { bank: true },
  });

  if (!user?.refreshTokenHash) {
    return { success: false as const, error: "Invalid refresh token" };
  }

  const isValid = await verifyRefreshTokenHash(
    data.refreshToken,
    user.refreshTokenHash,
  );
  if (!isValid) {
    return { success: false as const, error: "Invalid refresh token" };
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
  });

  const newRefreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
  });
  const newRefreshTokenHash = await hashRefreshToken(newRefreshToken);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash: newRefreshTokenHash },
  });

  return {
    success: true as const,
    token,
    refreshToken: newRefreshToken,
  };
}
