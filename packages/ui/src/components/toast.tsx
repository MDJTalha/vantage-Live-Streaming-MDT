import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-2xl border p-6 pr-8 shadow-lg transition-all duration-300 ease-in-out ' +
  'data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] ' +
  'data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 ' +
  'data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
  {
    variants: {
      variant: {
        default: 'bg-card border-border text-foreground',
        success: 'bg-success/10 border-success/30 text-success',
        error: 'bg-destructive/10 border-destructive/30 text-destructive',
        warning: 'bg-warning/10 border-warning/30 text-warning',
        info: 'bg-primary/10 border-primary/30 text-primary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof toastVariants> {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: () => void;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant, title, description, icon, action, onDismiss, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(toastVariants({ variant }), className)}
        {...props}
      >
        <div className="flex items-start gap-4">
          {icon && (
            <div className={cn(
              'flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center',
              variant === 'success' && 'bg-success/20',
              variant === 'error' && 'bg-destructive/20',
              variant === 'warning' && 'bg-warning/20',
              variant === 'info' && 'bg-primary/20'
            )}>
              {icon}
            </div>
          )}
          <div className="flex-1 space-y-1">
            {title && <p className="text-sm font-semibold">{title}</p>}
            {description && <p className="text-sm opacity-90">{description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {action}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="absolute right-2 top-2 rounded-lg p-1.5 text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }
);
Toast.displayName = 'Toast';

export { Toast, toastVariants };
