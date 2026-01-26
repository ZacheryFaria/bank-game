// Load environment variables from .env file
import 'dotenv/config'

import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import type { OpenAPIV3 } from 'openapi-types'
import { createOpenApiSpec } from './lib/openapi.js'
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

  await fastify.register(rateLimit, {
    global: true,
    max: process.env.RATE_LIMIT_MAX
      ? parseInt(process.env.RATE_LIMIT_MAX, 10)
      : 100,
    timeWindow: process.env.RATE_LIMIT_WINDOW || '1 minute',
    skipOnError: false,
  })

  // Generate OpenAPI specification
  const openApiDocument = createOpenApiSpec()

  // Register OpenAPI spec endpoint
  await fastify.register(fastifySwagger, {
    mode: 'static',
    specification: {
      document: openApiDocument as OpenAPIV3.Document,
    },
  })

  // Register Swagger UI
  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/api/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      defaultModelsExpandDepth: 2,
    },
    staticCSP: true,
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
