import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "link";
type Size = "sm" | "md" | "lg" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-soft transition-colors shadow-[0_14px_30px_-15px_rgba(16,52,104,0.6)]",
  secondary:
    "bg-card text-primary border border-border hover:border-primary/40 hover:bg-primary/5",
  ghost: "bg-transparent text-foreground hover:bg-primary/5",
  outline: "border border-border text-foreground hover:bg-primary/5",
  link: "text-info underline-offset-4 hover:underline",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 rounded-full px-4 text-sm", 
  md: "h-11 rounded-full px-6 text-sm", 
  lg: "h-12 rounded-full px-7 text-base", 
  icon: "h-10 w-10 rounded-full", 
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", asChild = false, ...props },
    ref,
  ) => {
    const Component = asChild ? Slot : "button";
    return (
      <Component
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium tracking-tight transition-transform duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
