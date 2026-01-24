import { readFileSync } from 'fs'
import { parse } from 'yaml'
import { join } from 'path'

interface TimeConfig {
  multiplier: number
  maxIdleHours: number
}

interface RateLimitConfig {
  collectCooldownSeconds: number
}

interface EconomyConfig {
  startingEquity: number
  reserveRequirement: number
  operatingCostRate: number
}

interface LoanProductConfig {
  baseDemandPerHour: number
  sensitivity: number
  avgLoanSize: number
}

interface DepositProductConfig {
  baseInflowPerHour: number
  sensitivity: number
}

interface DefaultVarianceConfig {
  min: number
  max: number
}

interface RawConfig {
  time: TimeConfig
  rateLimit: RateLimitConfig
  economy: EconomyConfig
  marketRates: Record<string, number>
  loanProducts: Record<string, LoanProductConfig>
  depositProducts: Record<string, DepositProductConfig>
  defaultRates: Record<string, number>
  defaultVariance: DefaultVarianceConfig
}

export interface GameConfig extends RawConfig {
  computed: {
    maxIdleQuarters: number
  }
}

function loadConfig(): GameConfig {
  const configPath = join(process.cwd(), 'config.yml')
  const fileContents = readFileSync(configPath, 'utf8')
  const rawConfig = parse(fileContents) as RawConfig

  return {
    ...rawConfig,
    computed: {
      maxIdleQuarters: rawConfig.time.maxIdleHours,
    },
  }
}

export const config = loadConfig()
