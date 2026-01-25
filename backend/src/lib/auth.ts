/**
 * Authentication Utilities
 * Password hashing and JWT tokens
 */

import bcrypt from 'bcrypt'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-secret-change-in-production'
const SALT_ROUNDS = 10

export interface JWTPayload {
  userId: string
  email: string
}

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generate a JWT access token (7-day expiry)
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  })
}

/**
 * Verify and decode a JWT access token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (_error) {
    return null
  }
}

/**
 * Generate a refresh token (30-day expiry)
 */
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '30d',
  })
}

/**
 * Verify and decode a refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (_error) {
    return null
  }
}

/**
 * Hash a refresh token for storage using HMAC-SHA256
 * Note: We use HMAC-SHA256 instead of bcrypt because:
 * 1. bcrypt has a 72-byte input limit (JWTs are ~250 chars)
 * 2. Refresh tokens are already cryptographically secure JWTs
 * 3. We don't need bcrypt's slow hashing (that's for passwords)
 * 4. HMAC adds secret-key authentication on top of SHA-256
 */
export function hashRefreshToken(token: string): string {
  return crypto.createHmac('sha256', REFRESH_TOKEN_SECRET).update(token).digest('hex');
}

/**
 * Verify a refresh token against a hash
 */
export function verifyRefreshTokenHash(
  token: string,
  hash: string
): boolean {
  const tokenHash = crypto.createHmac('sha256', REFRESH_TOKEN_SECRET).update(token).digest('hex');
  return tokenHash === hash;
}
