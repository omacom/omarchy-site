import { locale } from '@/i18n/site'
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons'

/**
 * Chevrons that follow the reading direction instead of the screen's edges.
 * `Start` points back towards where a line begins and `End` on towards where
 * it finishes, so a right-to-left page gets the mirror of a left-to-right
 * one and "previous" never points the way the reader is going.
 */
const rtl = locale.direction === 'rtl'

export const ChevronStartIcon = rtl ? ChevronRightIcon : ChevronLeftIcon
export const ChevronEndIcon = rtl ? ChevronLeftIcon : ChevronRightIcon
