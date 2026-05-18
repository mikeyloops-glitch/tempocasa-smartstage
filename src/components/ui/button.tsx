import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "dark";
  size?: "sm" | "md" | "lg" | "icon";
};

const variants = {
  primary: "bg-navy-900 text-white shadow-soft hover:bg-navy-800",
  secondary: "border border-silver-200 bg-white text-charcoal-950 hover:border-silver-300 hover:bg-silver-50",
  ghost: "text-charcoal-800 hover:bg-silver-100",
  dark: "bg-charcoal-950 text-white hover:bg-charcoal-800"
};

const sizes = {
  sm: "min-h-10 px-3 py-2 text-[0.95rem] sm:min-h-9 sm:text-sm",
  md: "min-h-12 px-4 py-3 text-base sm:min-h-11 sm:py-2.5 sm:text-sm",
  lg: "min-h-12 px-5 py-3 text-base",
  icon: "h-10 w-10 p-0"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, children, className, variant = "primary", size = "md", type = "button", ...props }, ref) => {
    const classes = cn(
      "interactive-surface inline-flex min-w-0 max-w-full items-center justify-center gap-2 rounded-md text-center font-medium leading-tight whitespace-normal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champagne-500 disabled:cursor-not-allowed disabled:opacity-55 [&>span]:min-w-0 [&>svg]:shrink-0",
      variants[variant],
      sizes[size],
      className
    );

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>;

      return React.cloneElement(child, {
        className: cn(classes, child.props.className)
      });
    }

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
