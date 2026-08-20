import { cx } from '@/utils/classNames'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
}

export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 py-2">
      <span>
        <span className="block text-sm font-medium text-text">{label}</span>
        {description && <span className="block text-xs text-text-muted">{description}</span>}
      </span>
      <span className="relative inline-flex shrink-0 items-center">
        <input
          type="checkbox"
          role="switch"
          aria-checked={checked}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={cx(
            'h-6 w-11 rounded-full bg-surface-sunken transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent',
            checked && 'bg-accent',
          )}
        />
        <span
          className={cx(
            'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none',
            checked && 'translate-x-5',
          )}
        />
      </span>
    </label>
  )
}
