import * as React from "react"
import { cn } from "@/lib/utils"

interface FunctionKeyProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  keyLabel: string
  description?: string
  variant?: "orange" | "blue" | "amber" | "cyan"
  size?: "sm" | "md"
}

const FunctionKey = React.forwardRef<HTMLButtonElement, FunctionKeyProps>(
  ({ className, keyLabel, description, variant = "orange", size = "md", ...props }, ref) => {
    const variants = {
      orange: "bg-bloomberg-orange hover:bg-bloomberg-orange/80",
      blue: "bg-bloomberg-blue hover:bg-bloomberg-blue/80",
      amber: "bg-bloomberg-amber hover:bg-bloomberg-amber/80",
      cyan: "bg-bloomberg-cyan hover:bg-bloomberg-cyan/80",
    }

    const sizes = {
      sm: {
        key: "px-1.5 py-0.5 text-[10px]",
        desc: "text-[10px]",
        gap: "gap-1",
      },
      md: {
        key: "px-2 py-1 text-xs",
        desc: "text-xs",
        gap: "gap-1.5",
      },
    }

    return (
      <button
        ref={ref}
        className={cn(
          "flex items-center font-mono transition-colors focus:outline-none focus:ring-1 focus:ring-ring",
          sizes[size].gap,
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "text-black font-bold uppercase",
            variants[variant],
            sizes[size].key
          )}
        >
          {keyLabel}
        </span>
        {description && (
          <span className={cn("text-foreground", sizes[size].desc)}>
            {description}
          </span>
        )}
      </button>
    )
  }
)
FunctionKey.displayName = "FunctionKey"

interface FunctionKeyBarProps extends React.HTMLAttributes<HTMLDivElement> {
  keys: Array<{
    keyLabel: string
    description?: string
    variant?: "orange" | "blue" | "amber" | "cyan"
    onClick?: () => void
  }>
}

const FunctionKeyBar = React.forwardRef<HTMLDivElement, FunctionKeyBarProps>(
  ({ className, keys, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-4 px-2 py-1.5 bg-secondary border-t border-border overflow-x-auto",
          className
        )}
        {...props}
      >
        {keys.map((key, index) => (
          <FunctionKey
            key={index}
            keyLabel={key.keyLabel}
            description={key.description}
            variant={key.variant}
            onClick={key.onClick}
            size="sm"
          />
        ))}
      </div>
    )
  }
)
FunctionKeyBar.displayName = "FunctionKeyBar"

export { FunctionKey, FunctionKeyBar }
