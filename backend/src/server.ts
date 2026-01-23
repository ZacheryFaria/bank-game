import Fastify from 'fastify'
import cors from '@fastify/cors'
import { authRoutes } from './routes/auth.js'
import { bankRoutes } from './routes/bank.js'
import { banksRoutes } from './routes/banks.js'
import { marketRoutes } from './routes/market.js'

const fastify = Fastify({
  logger: true,
})

// Register CORS plugin
await fastify.register(cors, {
  origin: true, // Allow all origins in development
})

// Health check endpoint
fastify.get('/health', () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// Register API routes
await fastify.register(authRoutes, { prefix: '/api' })
await fastify.register(bankRoutes, { prefix: '/api' })
await fastify.register(banksRoutes, { prefix: '/api' })
await fastify.register(marketRoutes, { prefix: '/api' })

// Start server
const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3001
    const host = process.env.HOST || '0.0.0.0'

    await fastify.listen({ port, host })
    console.log(`Server listening on http://localhost:${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

void start()
