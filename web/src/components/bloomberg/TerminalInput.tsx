import * as React from "react"
import { cn } from "@/lib/utils"

interface TerminalInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  onCommand?: (command: string) => void
  prompt?: string
  onChange?: (value: string) => void
}

const TerminalInput = React.forwardRef<HTMLInputElement, TerminalInputProps>(
  ({ className, onCommand, onChange, prompt = ">", ...props }, ref) => {
    const [value, setValue] = React.useState("")

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && value.trim() && onCommand) {
        onCommand(value.trim())
        setValue("")
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value)
      onChange?.(e.target.value)
    }

    return (
      <div className={cn("flex items-center bg-input border border-border", className)}>
        <span className="px-2 text-bloomberg-amber font-mono font-bold">{prompt}</span>
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex-1 bg-transparent py-2 pr-2 text-foreground font-mono text-sm",
            "placeholder:text-muted-foreground",
            "focus:outline-none",
            "caret-bloomberg-amber"
          )}
          {...props}
        />
        <span className="pr-2 text-bloomberg-amber animate-blink">█</span>
      </div>
    )
  }
)
TerminalInput.displayName = "TerminalInput"

interface TerminalOutputProps extends React.HTMLAttributes<HTMLDivElement> {
  lines: Array<{
    text: string
    type?: "info" | "success" | "error" | "warning" | "command"
  }>
  maxLines?: number
}

const TerminalOutput = React.forwardRef<HTMLDivElement, TerminalOutputProps>(
  ({ className, lines, maxLines = 100, ...props }, ref) => {
    const scrollRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, [lines])

    const typeColors = {
      info: "text-foreground",
      success: "text-bloomberg-green",
      error: "text-bloomberg-red",
      warning: "text-bloomberg-yellow",
      command: "text-bloomberg-cyan",
    }

    const displayLines = lines.slice(-maxLines)

    return (
      <div
        ref={ref}
        className={cn("bg-background border border-border overflow-hidden", className)}
        {...props}
      >
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto p-2 font-mono text-sm space-y-0.5"
        >
          {displayLines.map((line, index) => (
            <div key={index} className={cn(typeColors[line.type || "info"])}>
              {line.type === "command" && (
                <span className="text-bloomberg-amber mr-2">&gt;</span>
              )}
              {line.text}
            </div>
          ))}
        </div>
      </div>
    )
  }
)
TerminalOutput.displayName = "TerminalOutput"

export { TerminalInput, TerminalOutput }
