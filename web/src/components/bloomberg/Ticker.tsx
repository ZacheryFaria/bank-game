import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronUp, ChevronDown, Minus } from "lucide-react"

interface TickerProps extends React.HTMLAttributes<HTMLDivElement> {
  symbol: string
  value: number | string
  change?: number
  changePercent?: number
  size?: "sm" | "md" | "lg"
}

const Ticker = React.forwardRef<HTMLDivElement, TickerProps>(
  ({ className, symbol, value, change, changePercent, size = "md", ...props }, ref) => {
    const isPositive = change !== undefined && change > 0
    const isNegative = change !== undefined && change < 0
    const isNeutral = change === undefined || change === 0

    const sizes = {
      sm: {
        container: "gap-1",
        symbol: "text-xs",
        value: "text-sm",
        change: "text-xs",
        icon: "h-3 w-3",
      },
      md: {
        container: "gap-2",
        symbol: "text-sm",
        value: "text-lg",
        change: "text-sm",
        icon: "h-4 w-4",
      },
      lg: {
        container: "gap-3",
        symbol: "text-base",
        value: "text-2xl",
        change: "text-base",
        icon: "h-5 w-5",
      },
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center font-mono",
          sizes[size].container,
          className
        )}
        {...props}
      >
        <span className={cn("text-bloomberg-cyan font-bold uppercase", sizes[size].symbol)}>
          {symbol}
        </span>
        <span className={cn("text-foreground tabular-nums font-semibold", sizes[size].value)}>
          {typeof value === "number" ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}
        </span>
        {(change !== undefined || changePercent !== undefined) && (
          <span
            className={cn(
              "flex items-center tabular-nums",
              sizes[size].change,
              isPositive && "text-bloomberg-green",
              isNegative && "text-bloomberg-red",
              isNeutral && "text-muted-foreground"
            )}
          >
            {isPositive && <ChevronUp className={sizes[size].icon} />}
            {isNegative && <ChevronDown className={sizes[size].icon} />}
            {isNeutral && <Minus className={sizes[size].icon} />}
            {change !== undefined && (
              <span>{isPositive ? "+" : ""}{change.toFixed(2)}</span>
            )}
            {changePercent !== undefined && (
              <span className="ml-1">
                ({isPositive ? "+" : ""}{changePercent.toFixed(2)}%)
              </span>
            )}
          </span>
        )}
      </div>
    )
  }
)
Ticker.displayName = "Ticker"

interface TickerBarProps extends React.HTMLAttributes<HTMLDivElement> {
  tickers: Array<{
    symbol: string
    value: number | string
    change?: number
    changePercent?: number
  }>
  speed?: "slow" | "normal" | "fast"
}

const TickerBar = React.forwardRef<HTMLDivElement, TickerBarProps>(
  ({ className, tickers, speed = "normal", ...props }, ref) => {
    const speeds = {
      slow: "animate-[scroll_60s_linear_infinite]",
      normal: "animate-[scroll_30s_linear_infinite]",
      fast: "animate-[scroll_15s_linear_infinite]",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden bg-secondary border-y border-border py-1",
          className
        )}
        {...props}
      >
        <div className={cn("flex gap-8 whitespace-nowrap", speeds[speed])}>
          {[...tickers, ...tickers].map((ticker, index) => (
            <Ticker
              key={`${ticker.symbol}-${index}`}
              size="sm"
              {...ticker}
            />
          ))}
        </div>
      </div>
    )
  }
)
TickerBar.displayName = "TickerBar"

export { Ticker, TickerBar }
