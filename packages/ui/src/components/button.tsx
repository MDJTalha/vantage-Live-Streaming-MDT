import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 ease-out ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
  'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed ' +
  'active:scale-[0.98] backdrop-blur-md relative overflow-hidden ' +
  'hover:shadow-primary/30 hover:ring-2 hover:ring-primary/50',
  {
    variants: {
      variant: {
        default:
          'bg-secondary text-secondary-foreground ' +
          'border border-white/8 ' +
          'hover:bg-secondary/80 hover:border-primary/50 hover:ring-primary/50',

        // Aurora Primary - Sapphire gradient with blue hover
        primary:
          'bg-primary text-primary-foreground font-semibold ' +
          'shadow-lg hover:shadow-xl hover:shadow-primary/50 ' +
          'border border-white/10 ' +
          'hover:ring-2 hover:ring-primary hover:ring-offset-2',

        // Aurora Secondary - Glass
        secondary:
          'bg-secondary/50 text-secondary-foreground ' +
          'border border-white/8 ' +
          'hover:bg-secondary/80 hover:border-primary/50 hover:ring-2 hover:ring-primary/50',

        // Aurora Accent - Cyan
        accent:
          'bg-accent text-accent-foreground font-semibold ' +
          'shadow-lg hover:shadow-xl hover:shadow-accent/50 ' +
          'border border-white/10 ' +
          'hover:ring-2 hover:ring-accent hover:ring-offset-2',

        // Aurora Success - Emerald
        success:
          'bg-success text-success-foreground font-semibold ' +
          'shadow-lg hover:shadow-xl hover:shadow-success/50 ' +
          'border border-white/10 ' +
          'hover:ring-2 hover:ring-success hover:ring-offset-2',

        // Aurora Destructive - Ruby
        destructive:
          'bg-destructive/80 text-destructive-foreground font-semibold ' +
          'border border-destructive/30 ' +
          'hover:bg-destructive hover:ring-2 hover:ring-destructive/50',

        // Aurora Glass - Premium frosted
        glass:
          'bg-white/10 backdrop-blur-xl text-foreground font-semibold ' +
          'border border-white/12 ' +
          'shadow-lg hover:bg-white/20 hover:ring-2 hover:ring-primary/50',

        // Aurora Outline
        outline:
          'bg-transparent border-2 border-white/30 text-foreground font-semibold ' +
          'hover:bg-white/10 hover:border-primary hover:ring-2 hover:ring-primary hover:ring-offset-2',

        // Ghost - Subtle
        ghost:
          'bg-transparent text-foreground-muted font-medium ' +
          'hover:bg-white/10 hover:text-foreground hover:ring-2 hover:ring-primary/30',

        // Link
        link:
          'bg-transparent text-primary font-medium underline-offset-4 ' +
          'hover:underline hover:text-primary/80',

        // Icon button
        icon:
          'w-11 h-11 rounded-xl ' +
          'bg-white/5 border border-white/8 ' +
          'hover:bg-white/18 hover:border-primary/50 hover:ring-2 hover:ring-primary ' +
          'hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(59,130,246,.5)]',
      },
      size: {
        sm: 'h-9 px-4 text-xs rounded-lg',
        md: 'h-11 px-6 text-sm rounded-xl',
        lg: 'h-13 px-8 text-base rounded-xl',
        xl: 'h-15 px-10 text-lg rounded-2xl',
        icon: 'h-11 w-11 rounded-xl',
        iconSm: 'h-9 w-9 rounded-lg',
        iconLg: 'h-13 w-13 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  glow?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, leftIcon, rightIcon, children, disabled, glow, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {/* Shine effect for premium buttons */}
        {(variant === 'primary' || variant === 'accent' || variant === 'success') && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
        )}
        
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {children}
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
