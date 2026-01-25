import * as React from "react"
import { cn } from "@/lib/utils"

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  headerColor?: "blue" | "orange" | "amber" | "cyan" | "green" | "red"
  noPadding?: boolean
}

const headerColors = {
  blue: "bg-bloomberg-blue",
  orange: "bg-bloomberg-orange",
  amber: "bg-bloomberg-amber",
  cyan: "bg-bloomberg-cyan",
  green: "bg-bloomberg-green",
  red: "bg-bloomberg-red",
}

const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, title, headerColor = "blue", noPadding = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "border border-border bg-card flex flex-col overflow-hidden",
          className
        )}
        {...props}
      >
        {title && (
          <div
            className={cn(
              "px-2 py-1 text-black font-bold text-xs uppercase tracking-wider",
              headerColors[headerColor]
            )}
          >
            {title}
          </div>
        )}
        <div className={cn("flex-1 overflow-auto", !noPadding && "p-2")}>
          {children}
        </div>
      </div>
    )
  }
)
Panel.displayName = "Panel"

const PanelHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { color?: keyof typeof headerColors }
>(({ className, color = "blue", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-2 py-1 text-black font-bold text-xs uppercase tracking-wider",
      headerColors[color],
      className
    )}
    {...props}
  />
))
PanelHeader.displayName = "PanelHeader"

const PanelContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-2", className)}
    {...props}
  />
))
PanelContent.displayName = "PanelContent"

export { Panel, PanelHeader, PanelContent }
