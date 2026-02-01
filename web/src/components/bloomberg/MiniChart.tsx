import * as React from "react"
import { cn } from "@/lib/utils"
import { chartColors, chartBgColors, type ChartColor } from "./colors"

interface MiniChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: number[]
  color?: ChartColor
  height?: number
  showArea?: boolean
}

const MiniChart = React.forwardRef<HTMLDivElement, MiniChartProps>(
  ({ className, data, color = "amber", height = 40, showArea = false, ...props }, ref) => {
    const safeData = data.length < 2 ? [data[0] ?? 0, data[0] ?? 0] : data
    const min = Math.min(...safeData)
    const max = Math.max(...safeData)
    const range = max - min || 1

    const width = 100
    const points = safeData.map((value, index) => {
      const x = (index / (safeData.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    }).join(" ")

    const areaPoints = `0,${height} ${points} ${width},${height}`

    return (
      <div
        ref={ref}
        className={cn("overflow-hidden", className)}
        style={{ height }}
        {...props}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {showArea && (
            <polygon
              points={areaPoints}
              fill={chartColors[color].fill}
            />
          )}
          <polyline
            points={points}
            fill="none"
            stroke={chartColors[color].stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    )
  }
)
MiniChart.displayName = "MiniChart"

interface BarChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: Array<{ label: string; value: number; color?: ChartColor }>
  orientation?: "horizontal" | "vertical"
  height?: number
}

const BarChart = React.forwardRef<HTMLDivElement, BarChartProps>(
  ({ className, data, orientation = "horizontal", height = 120, ...props }, ref) => {
    const max = Math.max(1, ...data.map((d) => d.value))

    if (orientation === "horizontal") {
      return (
        <div ref={ref} className={cn("space-y-2", className)} {...props}>
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2 font-mono text-xs">
              <span className="w-16 text-muted-foreground truncate">{item.label}</span>
              <div className="flex-1 bg-secondary h-4 relative">
                <div
                  className={cn("h-full", chartBgColors[item.color || "amber"])}
                  style={{ width: `${(item.value / max) * 100}%` }}
                />
              </div>
              <span className="w-12 text-right tabular-nums text-foreground">
                {item.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn("flex items-end gap-1 justify-around", className)}
        style={{ height }}
        {...props}
      >
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center gap-1 flex-1">
            <div
              className={cn("w-full", chartBgColors[item.color || "amber"])}
              style={{ height: `${(item.value / max) * 100}%` }}
            />
            <span className="text-[10px] text-muted-foreground font-mono truncate w-full text-center">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    )
  }
)
BarChart.displayName = "BarChart"

export { MiniChart, BarChart }
