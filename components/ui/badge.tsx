import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-slate-900 text-slate-50 dark:bg-slate-50 dark:text-slate-900",
    secondary: "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100",
    destructive: "bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-400 border border-red-200 dark:border-red-900",
    success: "bg-green-100 text-green-800 dark:bg-green-950/80 dark:text-green-400 border border-green-200 dark:border-green-900",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-400 border border-amber-200 dark:border-amber-900",
    outline: "text-slate-950 border border-slate-200 dark:text-slate-50 dark:border-slate-800",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}