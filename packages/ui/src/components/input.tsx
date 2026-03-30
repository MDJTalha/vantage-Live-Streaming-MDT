import * as React from 'react';
import { cn } from '../utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'crystal' | 'filled' | 'underlined';
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  label?: string;
  helperText?: string;
  floatingLabel?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      variant = 'crystal',
      error,
      leftIcon,
      rightIcon,
      label,
      helperText,
      floatingLabel,
      disabled,
      placeholder,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: cn(
        'bg-white/5 border border-white/10',
        'focus:border-primary focus:ring-2 focus:ring-primary/30 focus:bg-white/10',
        'hover:border-white/30',
        'text-white placeholder:text-white/60'
      ),

      // Crystal Input - Premium glass with better visibility
      crystal: cn(
        'bg-white/5',
        'backdrop-blur-xl',
        'border border-white/10',
        'focus:border-primary focus:ring-2 focus:ring-primary/30 focus:bg-white/10',
        'hover:border-white/30',
        'text-white placeholder:text-white/60'
      ),

      filled: cn(
        'bg-white/10 border-transparent',
        'focus:bg-white/15 focus:border-primary focus:ring-2 focus:ring-primary/30',
        'hover:bg-white/20',
        'text-white placeholder:text-white/60'
      ),

      underlined: cn(
        'bg-transparent border-b-2 rounded-t-lg rounded-b-none',
        'focus:border-primary focus:ring-0',
        'hover:border-white/30',
        'text-white placeholder:text-white/60'
      ),
    };

    const inputClasses = cn(
      'flex h-12 w-full rounded-xl px-4 py-3',
      'text-foreground placeholder:text-muted-foreground/60',
      'transition-all duration-300 ease-out',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'focus:outline-none',
      variants[variant],
      leftIcon && 'pl-12',
      rightIcon && 'pr-12',
      error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
      floatingLabel && label && 'pt-5 peer',
      className
    );

    return (
      <div className="w-full space-y-2">
        {label && !floatingLabel && (
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          {label && floatingLabel && (
            <label className={cn(
              'absolute left-4 transition-all duration-300 ease-out',
              'text-muted-foreground pointer-events-none',
              'top-1/2 -translate-y-1/2',
              'peer-focus:-top-2 peer-focus:text-xs peer-focus:text-primary',
              'peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs',
              'bg-background/80 dark:bg-gray-900/80 px-1'
            )}>
              {label}
            </label>
          )}
          <input
            type={type}
            className={inputClasses}
            ref={ref}
            disabled={disabled}
            placeholder={placeholder ?? (floatingLabel && label ? ' ' : '')}
            aria-invalid={!!error}
            aria-describedby={error ? `${props.id || 'input'}-error` : helperText ? `${props.id || 'input'}-helper` : undefined}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
        {(error || helperText) && (
          <p 
            id={error ? `${props.id || 'input'}-error` : `${props.id || 'input'}-helper`}
            className={cn('text-sm', error ? 'text-destructive' : 'text-muted-foreground')}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
