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
      ...props
    },
    ref
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [width, setWidth] = React.useState(400);

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
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const timeRange = maxTime - minTime || 1;

    const padding = { top: 5, bottom: 25, left: 60, right: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const getX = (timestamp: Date) => {
      const t = timestamp.getTime();
      return padding.left + ((t - minTime) / timeRange) * chartWidth;
    };

    const points = data
      .map((d) => {
        const x = getX(d.timestamp);
        const y = padding.top + chartHeight - ((d.value - min) / range) * chartHeight;
        return `${x},${y}`;
      })
      .join(" ");

    const areaPoints = `${padding.left},${padding.top + chartHeight} ${points} ${padding.left + chartWidth},${padding.top + chartHeight}`;

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
        className={cn("overflow-hidden", className)}
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
        </svg>
      </div>
    );
  }
);

TimeSeriesChart.displayName = "TimeSeriesChart";

export { TimeSeriesChart };
export type { TimeSeriesChartProps, DataPoint };
