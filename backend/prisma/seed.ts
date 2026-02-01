import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth.js'
import { STARTING_EQUITY, MARKET_RATES } from '../src/engine/constants.js'

const prisma = new PrismaClient()

const DEV_USERS = [
  { email: 'dead@beef.com', password: 'deadbeef', bankName: 'Beef Bank' },
]

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DB_SEED !== 'true') {
    throw new Error('Refusing to run seed in production. Set ALLOW_DB_SEED=true to override.')
  }

  console.log('Seeding development database...')

  for (const userData of DEV_USERS) {
    const existing = await prisma.user.findUnique({
      where: { email: userData.email },
    })

    if (existing) {
      console.log(`User ${userData.email} already exists, skipping`)
      continue
    }

    const passwordHash = await hashPassword(userData.password)

    await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash,
        bank: {
          create: {
            name: userData.bankName,
            currentEquity: STARTING_EQUITY,
            currentLoans: 0,
            currentDeposits: 0,
            rates: {
              createMany: {
                data: Object.entries(MARKET_RATES).map(([product, rate]) => ({
                  product,
                  rate,
                })),
              },
            },
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
            transactions: {
              create: {
                timestamp: new Date(),
                collectedAt: new Date(),
                type: 'initial_funding',
                amount: STARTING_EQUITY,
                details: { description: 'Initial bank funding' },
              },
            },
          },
        },
      },
    })

    console.log(`Created user: ${userData.email}`)
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
