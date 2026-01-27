import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, min = 0, max = 100, step = 1, ...props }, ref) => {
  const [ghostPosition, setGhostPosition] = React.useState<number | null>(null)
  const trackRef = React.useRef<HTMLSpanElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))

    // Convert percent to value, snap to step, convert back to percent
    const rawValue = min + percent * (max - min)
    const snappedValue = Math.round(rawValue / step) * step
    const clampedValue = Math.max(min, Math.min(max, snappedValue))
    const snappedPercent = ((clampedValue - min) / (max - min)) * 100

    setGhostPosition(snappedPercent)
  }

  const handleMouseLeave = () => {
    setGhostPosition(null)
  }

  return (
    <SliderPrimitive.Root
      ref={ref}
      min={min}
      max={max}
      step={step}
      className={cn(
        "relative flex w-full touch-none select-none items-center cursor-pointer",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        ref={trackRef}
        className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20 before:absolute before:inset-0 before:-top-3 before:-bottom-3 before:content-['']"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {ghostPosition !== null && (
        <span
          className="slider-ghost absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full opacity-50 shadow pointer-events-none"
          style={{ left: `${ghostPosition}%` }}
        />
      )}
      <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
