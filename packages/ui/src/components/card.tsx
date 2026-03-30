import * as React from 'react';
import { cn } from '../utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'crystal' | 'elevated' | 'glass' | 'gradient' | 'interactive';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'crystal', ...props }, ref) => {
    const variants = {
      default: 'bg-card border border-border shadow-md',
      
      // Crystal Card - Premium glassmorphism
      crystal: 
        'relative overflow-hidden rounded-2xl ' +
        'bg-gradient-to-br from-white/80 via-white/60 to-white/40 ' +
        'dark:from-gray-900/80 dark:via-gray-900/60 dark:to-gray-900/40 ' +
        'backdrop-blur-2xl ' +
        'border border-white/50 dark:border-white/10 ' +
        'shadow-lg ' +
        'transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
      
      // Elevated - More depth
      elevated: 
        'relative overflow-hidden rounded-2xl ' +
        'bg-gradient-to-br from-white/90 via-white/70 to-white/50 ' +
        'dark:from-gray-900/90 dark:via-gray-900/70 dark:to-gray-900/50 ' +
        'backdrop-blur-2xl ' +
        'border border-white/60 dark:border-white/15 ' +
        'shadow-xl ' +
        'transition-all duration-300 hover:shadow-2xl hover:-translate-y-2',
      
      // Glass - Full transparency
      glass: 
        'relative overflow-hidden rounded-2xl ' +
        'bg-white/70 dark:bg-gray-900/70 ' +
        'backdrop-blur-2xl ' +
        'border border-white/40 dark:border-white/5 ' +
        'shadow-lg ' +
        'transition-all duration-300 hover:shadow-xl hover:bg-white/80 dark:hover:bg-gray-900/80',
      
      // Gradient - Colorful
      gradient: 
        'relative overflow-hidden rounded-2xl ' +
        'bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 ' +
        'dark:from-primary/20 dark:via-secondary/20 dark:to-accent/20 ' +
        'backdrop-blur-2xl ' +
        'border border-primary/20 dark:border-primary/30 ' +
        'shadow-lg ' +
        'transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
      
      // Interactive - Clickable
      interactive: 
        'relative overflow-hidden rounded-2xl ' +
        'bg-gradient-to-br from-white/80 via-white/60 to-white/40 ' +
        'dark:from-gray-900/80 dark:via-gray-900/60 dark:to-gray-900/40 ' +
        'backdrop-blur-2xl ' +
        'border border-white/50 dark:border-white/10 ' +
        'shadow-lg ' +
        'cursor-pointer ' +
        'transition-all duration-300 ' +
        'hover:shadow-2xl hover:-translate-y-2 hover:border-primary/30',
    };

    return (
      <div
        ref={ref}
        className={cn(variants[variant], className)}
        {...props}
      >
        {/* Subtle shine effect */}
        {variant === 'crystal' || variant === 'elevated' || variant === 'glass' ? (
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 pointer-events-none" />
        ) : null}
      </div>
    );
  }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'gradient' }
>(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: '',
    gradient: 'bg-gradient-to-r from-primary/5 via-secondary/5 to-transparent',
  };
  
  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col space-y-2 p-6 rounded-t-2xl',
        variants[variant],
        className
      )}
      {...props}
    />
  );
});
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-bold leading-none tracking-tight text-foreground',
      'bg-gradient-to-r from-foreground to-foreground-secondary bg-clip-text text-transparent',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground leading-relaxed', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0 rounded-b-2xl', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
