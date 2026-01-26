import * as React from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: number | string
  change?: number
  changeLabel?: string
  prefix?: string
  suffix?: string
  format?: "number" | "currency" | "percent" | "compact"
  trend?: "up" | "down" | "neutral"
  size?: "sm" | "md" | "lg"
}

const formatValue = (
  value: number | string | undefined | null,
  format: StatCardProps["format"],
  prefix?: string,
  suffix?: string
): string => {
  if (value === undefined || value === null) return "—"
  if (typeof value === "string") return `${prefix || ""}${value}${suffix || ""}`

  let formatted: string

  switch (format) {
    case "currency":
      formatted = value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      return `${prefix || "$"}${formatted}${suffix || ""}`
    case "percent":
      formatted = value.toFixed(2)
      return `${prefix || ""}${formatted}${suffix || "%"}`
    case "compact":
      const absValue = Math.abs(value)
      const sign = value < 0 ? "-" : ""
      if (absValue >= 1e12) {
        formatted = sign + (absValue / 1e12).toFixed(2) + "T"
      } else if (absValue >= 1e9) {
        formatted = sign + (absValue / 1e9).toFixed(2) + "B"
      } else if (absValue >= 1e6) {
        formatted = sign + (absValue / 1e6).toFixed(2) + "M"
      } else if (absValue >= 1e3) {
        formatted = sign + (absValue / 1e3).toFixed(2) + "K"
      } else {
        formatted = value.toFixed(2)
      }
      return `${prefix || ""}${formatted}${suffix || ""}`
    default:
      formatted = value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })
      return `${prefix || ""}${formatted}${suffix || ""}`
  }
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      label,
      value,
      change,
      changeLabel,
      prefix,
      suffix,
      format = "number",
      trend,
      size = "md",
      ...props
    },
    ref
  ) => {
    const determinedTrend =
      trend || (change !== undefined ? (change > 0 ? "up" : change < 0 ? "down" : "neutral") : undefined)

    const sizes = {
      sm: {
        label: "text-xs",
        value: "text-lg",
        change: "text-xs",
        icon: "h-3 w-3",
        padding: "p-2",
      },
      md: {
        label: "text-xs",
        value: "text-2xl",
        change: "text-sm",
        icon: "h-4 w-4",
        padding: "p-3",
      },
      lg: {
        label: "text-sm",
        value: "text-4xl",
        change: "text-base",
        icon: "h-5 w-5",
        padding: "p-4",
      },
    }

    return (
      <div
        ref={ref}
        className={cn(
          "bg-card border border-border flex flex-col",
          sizes[size].padding,
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "text-bloomberg-cyan uppercase tracking-wider font-semibold",
            sizes[size].label
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "font-mono font-bold tabular-nums text-foreground mt-1",
            sizes[size].value
          )}
        >
          {formatValue(value, format, prefix, suffix)}
        </span>
        {(change !== undefined || changeLabel) && (
          <div
            className={cn(
              "flex items-center gap-1 mt-1",
              sizes[size].change,
              determinedTrend === "up" && "text-bloomberg-green",
              determinedTrend === "down" && "text-bloomberg-red",
              determinedTrend === "neutral" && "text-muted-foreground"
            )}
          >
            {determinedTrend === "up" && <TrendingUp className={sizes[size].icon} />}
            {determinedTrend === "down" && <TrendingDown className={sizes[size].icon} />}
            {determinedTrend === "neutral" && <Minus className={sizes[size].icon} />}
            <span className="tabular-nums">
              {change !== undefined && (
                <>
                  {change > 0 ? "+" : ""}
                  {change.toFixed(2)}%
                </>
              )}
              {changeLabel && <span className="ml-1 text-muted-foreground">{changeLabel}</span>}
            </span>
          </div>
        )}
      </div>
    )
  }
)
StatCard.displayName = "StatCard"

interface StatRowProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: number | string
  variant?: "default" | "positive" | "negative" | "highlight" | "muted"
  format?: StatCardProps["format"]
  prefix?: string
  suffix?: string
}

const StatRow = React.forwardRef<HTMLDivElement, StatRowProps>(
  (
    { className, label, value, variant = "default", format = "number", prefix, suffix, ...props },
    ref
  ) => {
    const variants = {
      default: "text-foreground",
      positive: "text-bloomberg-green",
      negative: "text-bloomberg-red",
      highlight: "text-bloomberg-cyan",
      muted: "text-muted-foreground",
    }

    return (
      <div
        ref={ref}
        className={cn("flex justify-between items-center py-1 font-mono text-sm", className)}
        {...props}
      >
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("tabular-nums font-semibold", variants[variant])}>
          {formatValue(value, format, prefix, suffix)}
        </span>
      </div>
    )
  }
)
StatRow.displayName = "StatRow"

export { StatCard, StatRow, formatValue }
