import * as React from 'react';
import { cn } from '../utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'text', width, height, lines = 1, ...props }, ref) => {
    const baseClasses = 'animate-shimmer bg-muted relative overflow-hidden';
    
    const variantClasses = {
      text: 'h-4 rounded',
      circular: 'rounded-full',
      rectangular: 'rounded-md',
      rounded: 'rounded-lg',
    };

    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'string' ? width : `${width}px`;
    if (height) style.height = typeof height === 'string' ? height : `${height}px`;

    if (lines > 1) {
      return (
        <div className="space-y-2" {...props}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              ref={i === 0 ? ref : null}
              className={cn(baseClasses, variantClasses[variant], className)}
              style={i === 0 ? style : undefined}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], className)}
        style={style}
        {...props}
      />
    );
  }
);
Skeleton.displayName = 'Skeleton';

// Pre-built skeleton components
export const SkeletonText = React.forwardRef<HTMLDivElement, { lines?: number; className?: string }>(
  ({ lines = 3, className }, ref) => (
    <div className="space-y-3" ref={ref}>
      <div className={cn('h-4 w-3/4 rounded bg-muted animate-shimmer', className)} />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 rounded bg-muted animate-shimmer',
            i === lines - 1 && 'w-5/6',
            className
          )}
        />
      ))}
    </div>
  )
);
SkeletonText.displayName = 'SkeletonText';

export const SkeletonAvatar = React.forwardRef<HTMLDivElement, { size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }>(
  ({ size = 'md', className }, ref) => {
    const sizes = {
      sm: 'h-8 w-8',
      md: 'h-12 w-12',
      lg: 'h-16 w-16',
      xl: 'h-20 w-20',
    };
    
    return (
      <div
        ref={ref}
        className={cn('rounded-full bg-muted animate-shimmer', sizes[size], className)}
      />
    );
  }
);
SkeletonAvatar.displayName = 'SkeletonAvatar';

export const SkeletonCard = React.forwardRef<HTMLDivElement, { className?: string }>(
  ({ className }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-2xl border bg-card p-6 shadow-md space-y-4', className)}
    >
      <div className="flex items-center gap-4">
        <SkeletonAvatar size="md" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/2 rounded bg-muted animate-shimmer" />
          <div className="h-3 w-1/3 rounded bg-muted animate-shimmer" />
        </div>
      </div>
      <div className="space-y-2">
        <SkeletonText lines={2} />
      </div>
      <div className="flex gap-2 pt-2">
        <div className="h-9 w-24 rounded-lg bg-muted animate-shimmer" />
        <div className="h-9 w-24 rounded-lg bg-muted animate-shimmer" />
      </div>
    </div>
  )
);
SkeletonCard.displayName = 'SkeletonCard';

export const SkeletonVideoCard = React.forwardRef<HTMLDivElement, { className?: string }>(
  ({ className }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-2xl overflow-hidden bg-card border shadow-lg', className)}
    >
      <div className="aspect-video bg-muted animate-shimmer" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <SkeletonAvatar size="sm" />
          <div className="flex-1">
            <div className="h-4 w-1/3 rounded bg-muted animate-shimmer" />
          </div>
        </div>
        <div className="h-3 w-1/4 rounded bg-muted animate-shimmer" />
      </div>
    </div>
  )
);
SkeletonVideoCard.displayName = 'SkeletonVideoCard';

export { Skeleton };
