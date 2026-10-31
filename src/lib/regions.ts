/**
 * The world in six regions, by country code, for filtering the meetups.
 * Only the countries a meetup could plausibly land in are listed; a code
 * not here falls under "Elsewhere", which is honest rather than wrong.
 */
export const REGIONS = [
  'Europe',
  'North America',
  'South America',
  'Asia',
  'Africa',
  'Oceania',
] as const

export type Region = (typeof REGIONS)[number]

const BY_REGION: Record<Region, string> = {
  Europe:
    'AD AL AT BA BE BG BY CH CY CZ DE DK EE ES FI FR GB GR HR HU IE IS IT LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS RU SE SI SK SM UA VA XK',
  'North America': 'US CA MX GT BZ SV HN NI CR PA CU DO HT JM PR TT BS BB',
  'South America': 'AR BO BR CL CO EC GY PE PY SR UY VE',
  Asia: 'AE AM AZ BD BH BN BT CN GE HK ID IL IN IQ IR JO JP KG KH KR KW KZ LA LB LK MM MN MO MY NP OM PH PK QA SA SG SY TH TJ TL TM TR TW UZ VN YE',
  Africa:
    'AO BF BI BJ BW CD CF CG CI CM CV DJ DZ EG ER ET GA GH GM GN GQ GW KE KM LR LS LY MA MG ML MR MU MW MZ NA NE NG RW SC SD SL SN SO SS ST SZ TD TG TN TZ UG ZA ZM ZW',
  Oceania: 'AU NZ FJ PG SB VU WS TO',
}

const REGION_OF = new Map<string, Region>()
for (const region of REGIONS) {
  for (const code of BY_REGION[region].split(' ')) REGION_OF.set(code, region)
}

/** Every country code listed under a region. */
export function COUNTRIES_OF(region: Region): Set<string> {
  return new Set(BY_REGION[region].split(' '))
}

/** The region a country code belongs to, or null for one not listed. */
export function regionOf(country: string | null | undefined): Region | null {
  return country ? (REGION_OF.get(country.toUpperCase()) ?? null) : null
}
