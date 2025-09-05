import * as React from "react"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, style, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    
    return (
      <div
        ref={ref}
        className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-200 ${className || ''}`}
        style={style}
        {...props}
      >
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${percentage}%`,
            background: percentage > 80 
              ? 'linear-gradient(to right, #ef4444, #dc2626)'
              : percentage > 50 
                ? 'linear-gradient(to right, #f59e0b, #f97316)'
                : 'linear-gradient(to right, #10b981, #67e8f9)'
          }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }