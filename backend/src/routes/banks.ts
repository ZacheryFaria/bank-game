/**
 * Banks Routes (Other Banks)
 * GET /banks - List all banks (paginated, for leaderboards)
 * GET /banks/:id - View specific bank
 */

import type { FastifyInstance } from 'fastify'
import prisma from '../lib/db.js'

export function banksRoutes(fastify: FastifyInstance) {
  // GET /banks - List all banks
  fastify.get('/banks', async (request, reply) => {
    const { page = 1, limit = 50, sortBy = 'equity' } = request.query as any

    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)

    let orderBy: any = { currentEquity: 'desc' }
    if (sortBy === 'loans') {
      orderBy = { currentLoans: 'desc' }
    }

    const [banks, total] = await Promise.all([
      prisma.bank.findMany({
        select: {
          id: true,
          name: true,
          createdAt: true,
          currentEquity: true,
          currentLoans: true,
          currentDeposits: true,
          lastCollectedAt: true,
        },
        orderBy,
        skip,
        take,
      }),
      prisma.bank.count(),
    ])

    return reply.send({
      banks,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    })
  })

  // GET /banks/:id - View specific bank
  fastify.get('/banks/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    const bank = await prisma.bank.findUnique({
      where: { id },
      include: {
        rates: true,
        allocations: true,
        _count: {
          select: {
            loanBuckets: true,
            depositBuckets: true,
          },
        },
      },
    })

    if (!bank) {
      return reply.status(404).send({ error: 'Bank not found' })
    }

    return reply.send(bank)
  })
}
