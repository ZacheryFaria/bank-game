/**
 * Bank Routes
 * GET    /bank - Get your bank's current state
 * PUT    /bank/rates - Update your rates
 * PUT    /bank/allocation - Update risk allocation
 * POST   /bank/collect - Trigger collection (rate limited: 1/min)
 */

import type { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import prisma from '../lib/db.js'
import { authenticate } from '../lib/authMiddleware.js'
import { simulateCollection } from '../engine/CollectionSimulator.js'
import { COLLECT_COOLDOWN_SECONDS } from '../engine/constants.js'
import type { BankState } from '../engine/types.js'

const updateRatesSchema = z.object({
  rates: z.record(z.string(), z.number().min(0).max(0.5)),
})

const updateAllocationSchema = z.object({
  allocations: z.record(z.string(), z.number().min(0).max(1)),
})

export function bankRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate)

  // GET /bank
  fastify.get('/bank', async (request, reply) => {
    const bank = await prisma.bank.findUnique({
      where: { id: request.bank!.id },
      include: {
        rates: true,
        allocations: true,
        loanBuckets: {
          where: { currentBalance: { gt: 0 } },
        },
        depositBuckets: {
          where: { currentBalance: { gt: 0 } },
        },
      },
    })

    return reply.send(bank)
  })

  // PUT /bank/rates
  fastify.put('/bank/rates', async (request, reply) => {
    try {
      const body = updateRatesSchema.parse(request.body)
      const bankId = request.bank!.id

      for (const [product, rate] of Object.entries(body.rates)) {
        await prisma.bankRate.upsert({
          where: {
            bankId_product: {
              bankId,
              product,
            },
          },
          update: { rate },
          create: {
            bankId,
            product,
            rate,
          },
        })
      }

      const updatedRates = await prisma.bankRate.findMany({
        where: { bankId },
      })

      return reply.send({ success: true, rates: updatedRates })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply
          .status(400)
          .send({ error: 'Invalid input', details: error.errors })
      }
      console.error('Update rates error:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // PUT /bank/allocation
  fastify.put('/bank/allocation', async (request, reply) => {
    try {
      const body = updateAllocationSchema.parse(request.body)

      const total = Object.values(body.allocations).reduce(
        (sum, val) => sum + val,
        0
      )
      if (Math.abs(total - 1.0) > 0.0001) {
        return reply.status(400).send({ error: 'Allocations must sum to 1.0' })
      }

      const bankId = request.bank!.id

      for (const [riskClass, percentage] of Object.entries(body.allocations)) {
        await prisma.bankAllocation.upsert({
          where: {
            bankId_riskClass: {
              bankId,
              riskClass,
            },
          },
          update: { percentage },
          create: {
            bankId,
            riskClass,
            percentage,
          },
        })
      }

      const updatedAllocations = await prisma.bankAllocation.findMany({
        where: { bankId },
      })

      return reply.send({ success: true, allocations: updatedAllocations })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply
          .status(400)
          .send({ error: 'Invalid input', details: error.errors })
      }
      console.error('Update allocation error:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // POST /bank/collect
  fastify.post('/bank/collect', async (request, reply) => {
    try {
      const bank = await prisma.bank.findUnique({
        where: { id: request.bank!.id },
        include: {
          rates: true,
          allocations: true,
          loanBuckets: {
            where: { currentBalance: { gt: 0 } },
          },
          depositBuckets: {
            where: { currentBalance: { gt: 0 } },
          },
        },
      })

      if (!bank) {
        return reply.status(404).send({ error: 'Bank not found' })
      }

      // Rate limit check
      const now = new Date()
      const lastCollected = new Date(bank.lastCollectedAt)
      const secondsSinceLastCollect =
        (now.getTime() - lastCollected.getTime()) / 1000

      if (secondsSinceLastCollect < COLLECT_COOLDOWN_SECONDS) {
        const retryAfter = Math.ceil(
          COLLECT_COOLDOWN_SECONDS - secondsSinceLastCollect
        )
        return reply.status(429).send({
          error: 'Too soon',
          retryAfter,
        })
      }

      // Build bank state
      const bankState: BankState = {
        id: bank.id,
        name: bank.name,
        lastCollectedAt: bank.lastCollectedAt,
        currentEquity: Number(bank.currentEquity),
        currentLoans: Number(bank.currentLoans),
        currentDeposits: Number(bank.currentDeposits),
        rates: Object.fromEntries(
          bank.rates.map(r => [r.product, Number(r.rate)])
        ),
        allocations: Object.fromEntries(
          bank.allocations.map(a => [a.riskClass, Number(a.percentage)])
        ),
        loanBuckets: bank.loanBuckets.map(b => ({
          id: b.id,
          product: b.product as BankState['loanBuckets'][number]['product'],
          riskClass:
            b.riskClass as BankState['loanBuckets'][number]['riskClass'],
          originationHour: b.originationHour,
          originalPrincipal: Number(b.originalPrincipal),
          currentBalance: Number(b.currentBalance),
          interestRate: Number(b.interestRate),
          loanCount: b.loanCount,
          activeLoanCount: b.activeLoanCount,
        })),
        depositBuckets: bank.depositBuckets.map(b => ({
          id: b.id,
          product: b.product as BankState['depositBuckets'][number]['product'],
          originationHour: b.originationHour,
          originalAmount: Number(b.originalAmount),
          currentBalance: Number(b.currentBalance),
          interestRate: Number(b.interestRate),
          maturityDate: b.maturityDate || undefined,
        })),
      }

      // Run simulation
      const report = simulateCollection(bankState, now)

      // Save results in transaction
      await prisma.$transaction(async tx => {
        // Update bank state
        await tx.bank.update({
          where: { id: bank.id },
          data: {
            lastCollectedAt: now,
            currentEquity: report.endingEquity,
            currentLoans: report.endingLoans,
            currentDeposits: report.endingDeposits,
          },
        })

        // Create new loan buckets
        for (const bucket of report.newLoanBuckets) {
          await tx.loanBucket.create({
            data: {
              bankId: bank.id,
              product: bucket.product,
              riskClass: bucket.riskClass,
              originationHour: bucket.originationHour,
              originalPrincipal: bucket.originalPrincipal,
              currentBalance: bucket.currentBalance,
              interestRate: bucket.interestRate,
              loanCount: bucket.loanCount,
              activeLoanCount: bucket.activeLoanCount,
            },
          })
        }

        // Update existing loan buckets
        for (const bucket of report.updatedLoanBuckets) {
          await tx.loanBucket.update({
            where: { id: bucket.id },
            data: {
              currentBalance: bucket.currentBalance,
              activeLoanCount: bucket.activeLoanCount,
            },
          })
        }

        // Create new deposit buckets
        for (const bucket of report.newDepositBuckets) {
          await tx.depositBucket.create({
            data: {
              bankId: bank.id,
              product: bucket.product,
              originationHour: bucket.originationHour,
              originalAmount: bucket.originalAmount,
              currentBalance: bucket.currentBalance,
              interestRate: bucket.interestRate,
              maturityDate: bucket.maturityDate,
            },
          })
        }

        // Update existing deposit buckets
        for (const bucket of report.updatedDepositBuckets) {
          await tx.depositBucket.update({
            where: { id: bucket.id },
            data: {
              currentBalance: bucket.currentBalance,
            },
          })
        }

        // Record collection
        await tx.collection.create({
          data: {
            bankId: bank.id,
            collectedAt: now,
            gameTimeStart: report.gameTimeStart,
            gameTimeEnd: report.gameTimeEnd,
            realHoursElapsed: report.realHoursElapsed,
            gameQuartersElapsed: report.gameQuartersElapsed,
            loansOriginated: report.loansOriginated,
            interestIncome: report.interestIncome,
            interestExpense: report.interestExpense,
            defaultLosses: report.defaultLosses,
            operatingExpenses: report.operatingExpenses,
            netIncome: report.netIncome,
            endingEquity: report.endingEquity,
            endingLoans: report.endingLoans,
            endingDeposits: report.endingDeposits,
            randomSeed: report.randomSeed,
          },
        })

        // Record all transactions
        for (const txn of report.transactions) {
          await tx.transaction.create({
            data: {
              bankId: bank.id,
              timestamp: txn.timestamp,
              collectedAt: now,
              type: txn.type,
              amount: txn.amount,
              loanBucketId: txn.loanBucketId,
              depositBucketId: txn.depositBucketId,
              details: txn.details,
            },
          })
        }
      })

      return reply.send(report)
    } catch (error) {
      console.error('Collection error:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}
