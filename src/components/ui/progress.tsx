import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => {
  // Use state to smoothly animate the progress
  const [displayValue, setDisplayValue] = React.useState(value || 0);
  
  // Update the displayed value with a slight delay for smoothness
  React.useEffect(() => {
    // If no value provided, keep current display value
    if (value === undefined) return;
    
    // If the change is small or decreasing, update immediately
    if (Math.abs(displayValue - value) < 10 || value < displayValue) {
      setDisplayValue(value);
      return;
    }
    
    // For larger increases, animate smoothly
    const timeout = setTimeout(() => {
      setDisplayValue(prev => {
        const next = Math.min(prev + 5, value || 100);
        return next;
      });
    }, 50);
    
    return () => clearTimeout(timeout);
  }, [value, displayValue]);

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-primary transition-transform duration-300 ease-in-out"
        style={{ transform: `translateX(-${100 - displayValue}%)` }}
      />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
