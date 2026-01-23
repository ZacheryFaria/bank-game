/**
 * Market Routes
 * GET /market/rates - Get fixed market rates (reference)
 */

import type { FastifyInstance } from 'fastify'
import {
  MARKET_RATES,
  LOAN_PRODUCTS,
  DEPOSIT_PRODUCTS,
} from '../engine/constants.js'

export function marketRoutes(fastify: FastifyInstance) {
  // GET /market/rates
  fastify.get('/market/rates', async (request, reply) => {
    return reply.send({
      rates: MARKET_RATES,
      loanProducts: Object.entries(LOAN_PRODUCTS).map(([product, config]) => ({
        product,
        marketRate: config.marketRate,
        baseDemandPerHour: config.baseDemandPerHour,
        sensitivity: config.sensitivity,
        avgLoanSize: config.avgLoanSize,
      })),
      depositProducts: Object.entries(DEPOSIT_PRODUCTS).map(
        ([product, config]) => ({
          product,
          marketRate: config.marketRate,
          baseInflowPerHour: config.baseInflowPerHour,
          sensitivity: config.sensitivity,
        })
      ),
    })
  })
}
