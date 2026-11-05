import { createFormat } from './create-format.ts'
import type { IntlData } from './intl-data.ts'

export type { DateFormatName } from './intl-data.ts'

// This edition's data, inlined by astro.config.mjs. Keep this the only
// reference: define pastes the whole object wherever the name appears.
declare const __EDITION_INTL__: IntlData

export const { number, date, region } = createFormat(__EDITION_INTL__)
