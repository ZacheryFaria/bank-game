import { generateOpenApi } from '@ts-rest/open-api'
import { contract } from '@bank-game/shared'

export function createOpenApiSpec() {
  return generateOpenApi(
    contract,
    {
      info: {
        title: 'Bank Game API',
        version: '1.0.0',
        description:
          'Multiplayer idle game where players manage financial institutions',
      },
      servers: [
        {
          url: process.env.API_URL || 'http://localhost:3001',
          description: 'API Server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description:
              'JWT access token from /api/auth/login or /api/auth/register',
          },
        },
      },
    },
    {
      setOperationId: true,
      operationMapper: (operation, route) => {
        let tags: string[] = []

        switch (true) {
          case route.path.startsWith('/api/auth'):
            tags = ['Authentication']
            break
          case route.path.startsWith('/api/bank') &&
            !route.path.startsWith('/api/banks'):
            tags = ['Player Bank']
            break
          case route.path.startsWith('/api/banks'):
            tags = ['Leaderboard']
            break
          case route.path.startsWith('/api/market'):
            tags = ['Market Data']
            break
        }

        const requiresAuth =
          (route.metadata as { requiresAuth?: boolean } | undefined)
            ?.requiresAuth === true

        return {
          ...operation,
          tags,
          security: requiresAuth ? [{ bearerAuth: [] }] : undefined,
        }
      },
    }
  )
}
