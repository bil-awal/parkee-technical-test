import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-xl border px-4 py-3 text-sm transition-all duration-200 ease-out [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default:
          "bg-blue-50/80 border-blue-200/60 text-blue-900 backdrop-blur-sm [&>svg]:text-blue-600 dark:bg-blue-950/30 dark:border-blue-800/40 dark:text-blue-100 dark:[&>svg]:text-blue-400",
        destructive:
          "bg-red-50/80 border-red-200/60 text-red-900 backdrop-blur-sm [&>svg]:text-red-600 dark:bg-red-950/30 dark:border-red-800/40 dark:text-red-100 dark:[&>svg]:text-red-400",
        warning:
          "bg-amber-50/80 border-amber-200/60 text-amber-900 backdrop-blur-sm [&>svg]:text-amber-600 dark:bg-amber-950/30 dark:border-amber-800/40 dark:text-amber-100 dark:[&>svg]:text-amber-400",
        success:
          "bg-emerald-50/80 border-emerald-200/60 text-emerald-900 backdrop-blur-sm [&>svg]:text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-800/40 dark:text-emerald-100 dark:[&>svg]:text-emerald-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    aria-live="polite"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn(
      "mb-1 font-semibold leading-none tracking-tight text-[15px]",
      className
    )}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-sm leading-relaxed [&_p]:leading-relaxed opacity-90",
      className
    )}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }