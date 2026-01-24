import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import { registerApiRoutes } from './routes/api.js'

export async function createServer(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  })

  const allowedOrigins = process.env.ALLOWED_ORIGINS || '*'

  await fastify.register(cors, {
    origin:
      allowedOrigins === '*'
        ? true
        : allowedOrigins.split(',').map(o => o.trim()),
  })

  // Health check endpoint
  fastify.get('/health', () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // Register API routes
  await fastify.register(registerApiRoutes)

  return fastify
}

// Start server if running directly (not imported for tests)
if (process.env.NODE_ENV !== 'test') {
  const fastify = await createServer()

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
}
