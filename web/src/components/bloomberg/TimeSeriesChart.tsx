import * as React from "react";
import { cn } from "@/lib/utils";
import { chartColors, type ChartColor } from "./colors";

interface DataPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

interface TimeSeriesChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: DataPoint[];
  color?: ChartColor;
  height?: number;
  showArea?: boolean;
  formatValue?: (value: number) => string;
  formatLabel?: (timestamp: Date, index: number, total: number) => string;
  /** Minimum time span in ms for the x-axis. The axis will always cover at least this duration. */
  minTimeSpanMs?: number;
}

const defaultFormatValue = (value: number): string => {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
};

const TimeSeriesChart = React.forwardRef<HTMLDivElement, TimeSeriesChartProps>(
  (
    {
      className,
      data,
      color = "amber",
      height = 120,
      showArea = true,
      formatValue = defaultFormatValue,
      formatLabel,
      minTimeSpanMs,
      ...props
    },
    ref
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [width, setWidth] = React.useState(400);
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

    React.useEffect(() => {
      const updateWidth = () => {
        if (containerRef.current) {
          setWidth(containerRef.current.offsetWidth);
        }
      };
      updateWidth();
      const resizeObserver = new ResizeObserver(updateWidth);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }
      return () => resizeObserver.disconnect();
    }, []);

    if (data.length < 2) {
      return (
        <div
          ref={ref}
          className={cn(
            "flex items-center justify-center text-muted-foreground text-sm font-mono",
            className
          )}
          style={{ height }}
          {...props}
        >
          Not enough data
        </div>
      );
    }

    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const times = data.map((d) => d.timestamp.getTime());
    let minTime = Math.min(...times);
    let maxTime = Math.max(...times);
    // Enforce minimum time span on the x-axis
    if (minTimeSpanMs && maxTime - minTime < minTimeSpanMs) {
      maxTime = Math.max(maxTime, Date.now());
      minTime = maxTime - minTimeSpanMs;
    }
    const timeRange = maxTime - minTime || 1;

    const padding = { top: 20, bottom: 25, left: 60, right: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const getX = (timestamp: Date) => {
      const t = timestamp.getTime();
      return padding.left + ((t - minTime) / timeRange) * chartWidth;
    };

    const getY = (value: number) => {
      return padding.top + chartHeight - ((value - min) / range) * chartHeight;
    };

    const points = data
      .map((d) => `${getX(d.timestamp)},${getY(d.value)}`)
      .join(" ");

    const handleMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left + padding.left;
      let closest = 0;
      let closestDist = Infinity;
      for (let i = 0; i < data.length; i++) {
        const dist = Math.abs(getX(data[i].timestamp) - mouseX);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      }
      setHoveredIndex(closest);
    };

    const firstX = getX(data[0].timestamp);
    const lastX = getX(data[data.length - 1].timestamp);
    const areaPoints = `${firstX},${padding.top + chartHeight} ${points} ${lastX},${padding.top + chartHeight}`;

    // Select label indices spread across time, not array position
    const labelIndices: number[] = [];
    if (data.length <= 6) {
      labelIndices.push(...data.map((_, i) => i));
    } else {
      // Pick ~5 evenly spaced labels by time
      const labelCount = 5;
      for (let i = 0; i < labelCount; i++) {
        const targetTime = minTime + (i / (labelCount - 1)) * timeRange;
        // Find closest data point to this target time
        let closestIdx = 0;
        let closestDiff = Infinity;
        for (let j = 0; j < data.length; j++) {
          const diff = Math.abs(data[j].timestamp.getTime() - targetTime);
          if (diff < closestDiff) {
            closestDiff = diff;
            closestIdx = j;
          }
        }
        if (!labelIndices.includes(closestIdx)) {
          labelIndices.push(closestIdx);
        }
      }
    }

    return (
      <div
        ref={(node) => {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn("overflow-hidden border border-border rounded", className)}
        {...props}
      >
        <svg width={width} height={height}>
          {/* Y-axis labels */}
          <text
            x={padding.left - 5}
            y={padding.top + 4}
            textAnchor="end"
            className="fill-muted-foreground"
            style={{ fontSize: "10px", fontFamily: "monospace" }}
          >
            {formatValue(max)}
          </text>
          <text
            x={padding.left - 5}
            y={padding.top + chartHeight}
            textAnchor="end"
            className="fill-muted-foreground"
            style={{ fontSize: "10px", fontFamily: "monospace" }}
          >
            {formatValue(min)}
          </text>

          {/* Chart area */}
          {showArea && (
            <polygon points={areaPoints} fill={chartColors[color].fill} />
          )}
          <polyline
            points={points}
            fill="none"
            stroke={chartColors[color].stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data point dots */}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={getX(d.timestamp)}
              cy={getY(d.value)}
              r={2.5}
              fill={chartColors[color].stroke}
              stroke="rgba(0,0,0,0.5)"
              strokeWidth="0.5"
            />
          ))}

          {/* X-axis labels */}
          {labelIndices.map((i) => {
            const x = getX(data[i].timestamp);
            const label =
              data[i].label ||
              (formatLabel
                ? formatLabel(data[i].timestamp, i, data.length)
                : data[i].timestamp.toLocaleDateString(undefined, { month: "short", day: "numeric" }));
            return (
              <text
                key={i}
                x={x}
                y={height - 5}
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{ fontSize: "10px", fontFamily: "monospace" }}
              >
                {label}
              </text>
            );
          })}

          {/* Hover overlay */}
          <rect
            x={padding.left}
            y={padding.top}
            width={chartWidth}
            height={chartHeight}
            fill="transparent"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{ cursor: "crosshair" }}
          />

          {/* Crosshair + tooltip */}
          {hoveredIndex !== null && (() => {
            const hx = getX(data[hoveredIndex].timestamp);
            const hy = getY(data[hoveredIndex].value);
            const dateLabel = data[hoveredIndex].timestamp.toLocaleDateString(undefined, {
              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
            });
            // Anchor tooltip left or right to keep it in bounds
            const tooltipAnchor = hx > padding.left + chartWidth / 2 ? "end" : "start";
            const tooltipX = tooltipAnchor === "end" ? hx - 12 : hx + 12;
            // Position tooltip as a group above the point, or below if near top
            const tooltipAbove = hy > padding.top + 36;
            const groupY = tooltipAbove ? hy - 28 : hy + 16;
            const valueLabelY = groupY;
            const dateLabelY = groupY + 13;
            const bgW = 110;
            const bgH = 30;
            const bgX = tooltipAnchor === "end" ? tooltipX - bgW + 4 : tooltipX - 4;
            const bgY = valueLabelY - 12;
            return (
              <>
                <line
                  x1={hx} y1={padding.top}
                  x2={hx} y2={padding.top + chartHeight}
                  stroke="rgba(255,255,255,0.2)"
                  strokeDasharray="3,3"
                />
                <circle
                  cx={hx} cy={hy} r={3.5}
                  fill={chartColors[color].stroke}
                  stroke="rgba(0,0,0,0.8)"
                  strokeWidth="1.5"
                />
                {/* Tooltip background */}
                <rect
                  x={bgX}
                  y={bgY}
                  width={bgW}
                  height={bgH}
                  rx={3}
                  fill="rgba(30,30,30,0.9)"
                />
                <text
                  x={tooltipX}
                  y={valueLabelY}
                  textAnchor={tooltipAnchor}
                  className="fill-foreground"
                  style={{ fontSize: "11px", fontFamily: "monospace", fontWeight: 600 }}
                >
                  {formatValue(data[hoveredIndex].value)}
                </text>
                <text
                  x={tooltipX}
                  y={dateLabelY}
                  textAnchor={tooltipAnchor}
                  className="fill-muted-foreground"
                  style={{ fontSize: "9px", fontFamily: "monospace" }}
                >
                  {dateLabel}
                </text>
              </>
            );
          })()}
        </svg>
      </div>
    );
  }
);

TimeSeriesChart.displayName = "TimeSeriesChart";

export { TimeSeriesChart };
export type { TimeSeriesChartProps, DataPoint };
