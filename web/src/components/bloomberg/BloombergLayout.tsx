import * as React from "react"
import { cn } from "@/lib/utils"

const BloombergLayout = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col h-screen bg-background overflow-hidden", className)}
      {...props}
    />
  )
)
BloombergLayout.displayName = "BloombergLayout"

const BloombergHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <header
    ref={ref}
    className={cn(
      "flex items-center justify-between px-4 py-2 bg-secondary border-b border-border shrink-0",
      className
    )}
    {...props}
  />
))
BloombergHeader.displayName = "BloombergHeader"

const BloombergMain = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <main
    ref={ref}
    className={cn("flex-1 overflow-hidden", className)}
    {...props}
  />
))
BloombergMain.displayName = "BloombergMain"

const BloombergFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <footer
    ref={ref}
    className={cn(
      "shrink-0 border-t border-border bg-secondary",
      className
    )}
    {...props}
  />
))
BloombergFooter.displayName = "BloombergFooter"

interface BloombergGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4
  gap?: "none" | "sm" | "md"
}

const BloombergGrid = React.forwardRef<HTMLDivElement, BloombergGridProps>(
  ({ className, cols = 2, gap = "sm", ...props }, ref) => {
    const gridCols = {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    }

    const gaps = {
      none: "gap-0",
      sm: "gap-px",
      md: "gap-1",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid h-full bg-border",
          gridCols[cols],
          gaps[gap],
          className
        )}
        {...props}
      />
    )
  }
)
BloombergGrid.displayName = "BloombergGrid"

interface SplitPaneProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "horizontal" | "vertical"
  ratio?: string
}

const SplitPane = React.forwardRef<HTMLDivElement, SplitPaneProps>(
  ({ className, direction = "horizontal", ratio = "1fr 1fr", children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("h-full bg-border gap-px", className)}
      style={{
        display: "grid",
        gridTemplate: direction === "horizontal" ? `1fr / ${ratio}` : `${ratio} / 1fr`,
      }}
      {...props}
    >
      {children}
    </div>
  )
)
SplitPane.displayName = "SplitPane"

export {
  BloombergLayout,
  BloombergHeader,
  BloombergMain,
  BloombergFooter,
  BloombergGrid,
  SplitPane,
}
