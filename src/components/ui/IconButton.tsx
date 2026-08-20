import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cx } from '@/utils/classNames'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  active?: boolean
  variant?: 'default' | 'danger'
}

/** Icon-only button that enforces an accessible label via `aria-label`
 * and shows a native tooltip via `title` for sighted mouse users. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, active, variant = 'default', className, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        className={cx(
          'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-text-muted transition-colors',
          'hover:bg-surface-raised hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1',
          active && 'bg-accent/15 text-accent border-accent/30',
          variant === 'danger' && 'hover:bg-red-500/15 hover:text-red-500',
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    )
  },
)
IconButton.displayName = 'IconButton'
