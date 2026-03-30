import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

const avatarVariants = cva(
  'relative inline-flex items-center justify-center rounded-full overflow-hidden font-semibold transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-br from-primary to-secondary text-white',
        gradient: 'bg-gradient-to-br from-primary via-secondary to-accent text-white',
        solid: 'bg-muted text-foreground',
        image: '',
      },
      size: {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-16 w-16 text-lg',
        '2xl': 'h-20 w-20 text-xl',
        '3xl': 'h-24 w-24 text-2xl',
      },
      ring: {
        none: '',
        primary: 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        success: 'ring-2 ring-success ring-offset-2 ring-offset-background',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      ring: 'none',
    },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string | null;
  alt?: string;
  name?: string;
  status?: 'online' | 'offline' | 'busy' | 'away';
  showStatus?: boolean;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    { className, variant, size, ring, src, alt, name, status, showStatus, ...props },
    ref
  ) => {
    const getInitials = (name?: string) => {
      if (!name) return '?';
      const names = name.trim().split(' ');
      const initials = names.length > 1 ? names[0][0] + names[names.length - 1][0] : names[0][0];
      return initials.toUpperCase();
    };

    const statusColors = {
      online: 'bg-success',
      offline: 'bg-muted-foreground',
      busy: 'bg-destructive',
      away: 'bg-warning',
    };

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ variant, size, ring }), className)}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <span
          className={cn(
            'flex h-full w-full items-center justify-center',
            src ? 'hidden' : ''
          )}
        >
          {getInitials(name)}
        </span>
        {showStatus && status && (
          <span
            className={cn(
              'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background',
              statusColors[status]
            )}
          />
        )}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';

export { Avatar, avatarVariants };
