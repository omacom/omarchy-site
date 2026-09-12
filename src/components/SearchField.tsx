import type { ReactNode, RefObject } from 'react'
import { SearchIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

export function SearchField({
  value,
  onChange,
  placeholder,
  label,
  trailing,
  inputRef,
  onFocus,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  /** Names the field for screen readers; there is no visible label. */
  label: string
  /** Sits at the end edge, inside the field. Decorative or a real control. */
  trailing?: ReactNode
  /** For fields that open something on focus, like a results list. */
  onFocus?: () => void
  inputRef?: RefObject<HTMLInputElement | null>
  className?: string
}) {
  return (
    <div className={cn('relative min-w-0', className)}>
      <SearchIcon className="pointer-events-none absolute top-1/2 start-3 size-5 -translate-y-1/2 text-text-muted" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        aria-label={label}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        enterKeyHint="search"
        className={cn(
          'h-10 w-full border border-border-strong bg-bg-deep ps-10 text-base text-text placeholder:text-text-muted',
          'transition-[border-color] duration-150 ease-out hover:border-border-strong',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          trailing ? 'pe-10' : 'pe-3',
        )}
      />
      {trailing ? (
        <div className="absolute top-1/2 end-2.5 -translate-y-1/2">
          {trailing}
        </div>
      ) : null}
    </div>
  )
}
