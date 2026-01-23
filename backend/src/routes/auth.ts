/**
 * Auth Routes
 * POST /auth/register - Register new user
 * POST /auth/login - Login existing user
 */

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/db.js';
import { hashPassword, verifyPassword, generateToken } from '../lib/auth.js';
import { STARTING_EQUITY, MARKET_RATES } from '../engine/constants.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  bankName: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
  // POST /auth/register
  fastify.post('/auth/register', async (request, reply) => {
    try {
      const body = registerSchema.parse(request.body);

      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (existing) {
        return reply.status(400).send({ error: 'Email already registered' });
      }

      // Hash password
      const passwordHash = await hashPassword(body.password);

      // Create user and bank in transaction
      const user = await prisma.user.create({
        data: {
          email: body.email,
          passwordHash,
          bank: {
            create: {
              name: body.bankName,
              currentEquity: STARTING_EQUITY,
              currentLoans: 0,
              currentDeposits: 0,
              // Initialize with market rates
              rates: {
                createMany: {
                  data: Object.entries(MARKET_RATES).map(([product, rate]) => ({
                    product,
                    rate,
                  })),
                },
              },
              // Initialize with equal allocation
              allocations: {
                createMany: {
                  data: [
                    { riskClass: 'super_prime', percentage: 0.25 },
                    { riskClass: 'prime', percentage: 0.25 },
                    { riskClass: 'near_prime', percentage: 0.25 },
                    { riskClass: 'subprime', percentage: 0.25 },
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

      // Generate token
      const token = generateToken({
        userId: user.id,
        email: user.email,
      });

      return reply.send({
        token,
        user: {
          id: user.id,
          email: user.email,
          bank: user.bank,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      console.error('Registration error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // POST /auth/login
  fastify.post('/auth/login', async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: body.email },
        include: {
          bank: true,
        },
      });

      if (!user) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      // Verify password
      const valid = await verifyPassword(body.password, user.passwordHash);
      if (!valid) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = generateToken({
        userId: user.id,
        email: user.email,
      });

      return reply.send({
        token,
        user: {
          id: user.id,
          email: user.email,
          bank: user.bank,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      console.error('Login error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
