import * as React from "react"
import { cn } from "@/lib/utils"

interface DataGridProps extends React.HTMLAttributes<HTMLTableElement> {}

const DataGrid = React.forwardRef<HTMLTableElement, DataGridProps>(
  ({ className, ...props }, ref) => (
    <table
      ref={ref}
      className={cn("w-full font-mono text-sm border-collapse", className)}
      {...props}
    />
  )
)
DataGrid.displayName = "DataGrid"

const DataGridHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("border-b border-border", className)}
    {...props}
  />
))
DataGridHeader.displayName = "DataGridHeader"

const DataGridBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("", className)} {...props} />
))
DataGridBody.displayName = "DataGridBody"

const DataGridRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { highlighted?: boolean }
>(({ className, highlighted, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-border/50 hover:bg-secondary/50 transition-colors",
      highlighted && "bg-bloomberg-blue/10",
      className
    )}
    {...props}
  />
))
DataGridRow.displayName = "DataGridRow"

const DataGridHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-left text-xs uppercase tracking-wider text-bloomberg-cyan font-bold",
      className
    )}
    {...props}
  />
))
DataGridHead.displayName = "DataGridHead"

const DataGridCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & {
    variant?: "default" | "positive" | "negative" | "muted" | "highlight"
    numeric?: boolean
  }
>(({ className, variant = "default", numeric = false, ...props }, ref) => {
  const variants = {
    default: "text-foreground",
    positive: "text-bloomberg-green",
    negative: "text-bloomberg-red",
    muted: "text-muted-foreground",
    highlight: "text-bloomberg-cyan",
  }

  return (
    <td
      ref={ref}
      className={cn(
        "px-2 py-1.5 text-sm",
        numeric && "text-right tabular-nums",
        variants[variant],
        className
      )}
      {...props}
    />
  )
})
DataGridCell.displayName = "DataGridCell"

export {
  DataGrid,
  DataGridHeader,
  DataGridBody,
  DataGridRow,
  DataGridHead,
  DataGridCell,
}
