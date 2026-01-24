/**
 * Authentication Middleware
 * Validates JWT from Authorization header and attaches bank to request
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import type { Bank } from '@prisma/client'
import { verifyToken } from './auth.js'
import prisma from './db.js'

/**
 * Fastify preHandler hook for protected routes
 * Extracts and validates JWT, loads bank from database
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return reply
      .status(401)
      .send({ error: 'Missing or invalid authorization header' })
  }

  const token = authHeader.substring(7)
  const payload = verifyToken(token)
  if (!payload) {
    return reply.status(401).send({ error: 'Invalid or expired token' })
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      bank: true,
    },
  })

  if (!user?.bank) {
    return reply.status(401).send({ error: 'User or bank not found' })
  }

  request.bank = user.bank
}

declare module 'fastify' {
  interface FastifyRequest {
    bank?: Bank
  }
}
