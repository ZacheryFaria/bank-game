export type ChartColor = "amber" | "green" | "red" | "blue" | "cyan";

export const chartColors: Record<ChartColor, { stroke: string; fill: string }> = {
  amber: { stroke: "hsl(var(--bloomberg-amber))", fill: "hsl(var(--bloomberg-amber) / 0.2)" },
  green: { stroke: "hsl(var(--bloomberg-green))", fill: "hsl(var(--bloomberg-green) / 0.2)" },
  red: { stroke: "hsl(var(--bloomberg-red))", fill: "hsl(var(--bloomberg-red) / 0.2)" },
  blue: { stroke: "hsl(var(--bloomberg-blue))", fill: "hsl(var(--bloomberg-blue) / 0.2)" },
  cyan: { stroke: "hsl(var(--bloomberg-cyan))", fill: "hsl(var(--bloomberg-cyan) / 0.2)" },
};

export const chartBgColors: Record<ChartColor, string> = {
  amber: "bg-bloomberg-amber",
  green: "bg-bloomberg-green",
  red: "bg-bloomberg-red",
  blue: "bg-bloomberg-blue",
  cyan: "bg-bloomberg-cyan",
};
