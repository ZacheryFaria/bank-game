/**
 * Authentication Utilities
 * Password hashing and JWT tokens
 */

import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
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
 * Hash a refresh token for storage
 */
export async function hashRefreshToken(token: string): Promise<string> {
  return bcrypt.hash(token, SALT_ROUNDS)
}

/**
 * Verify a refresh token against a hash
 */
export async function verifyRefreshTokenHash(
  token: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(token, hash)
}
