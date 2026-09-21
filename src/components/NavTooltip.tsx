import type { ReactElement } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function NavTooltip({
  children,
  label,
  shortcut,
}: {
  children: ReactElement
  label: string
  shortcut?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side="bottom" sideOffset={10}>
        {label}
        {shortcut && (
          <kbd className="ml-1 rounded border border-current/25 px-1 font-mono text-[11px] opacity-75">
            {shortcut}
          </kbd>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
