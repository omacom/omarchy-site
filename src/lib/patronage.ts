export const PATRONAGE_URL = 'https://donate.omarchy.org'

/** USD thresholds in cents, matching the existing rally badges. */
export const PATRON_CLASSES = [
  { id: '8k', badge: '8K', minimum: 819200, stage: 'Night Stage' },
  { id: '2k', badge: '2K', minimum: 204800, stage: 'Service Park' },
  { id: '256', badge: '256', minimum: 25600, stage: 'Mountain Hairpin' },
  { id: '016', badge: '016', minimum: 1600, stage: 'Forest Stage' },
] as const

export interface PublicDonation {
  id: string
  fullName: string | null
  amount: number
  currency: string
}

export interface PatronageSummary {
  namedPatrons: number
  anonymousDonations: number
  donations: number
  totalAmount: number
  currency: string
}

export interface PatronageTier {
  id: string
  names: string[]
  anonymousDonations: number
}

export function patronClass(amount: number): string {
  return PATRON_CLASSES.find((tier) => amount >= tier.minimum)?.id ?? 'other'
}

/** A displayed name is all the public feed identifies. Preserve its spelling,
 * combine exact matches as the existing roll did, and never merge anonymous gifts. */
export function summarizePatronage(donations: PublicDonation[]) {
  const summary: PatronageSummary = {
    namedPatrons: 0,
    anonymousDonations: 0,
    donations: 0,
    totalAmount: 0,
    currency: 'usd',
  }
  const tiers: PatronageTier[] = [...PATRON_CLASSES, { id: 'other' }].map(
    ({ id }) => ({ id, names: [], anonymousDonations: 0 }),
  )
  const named = new Map<string, number>()
  const seen = new Set<string>()
  for (const donation of donations) {
    if (
      !donation ||
      typeof donation.id !== 'string' ||
      !donation.id ||
      (donation.fullName !== null && typeof donation.fullName !== 'string') ||
      !Number.isSafeInteger(donation.amount) ||
      donation.amount < 0 ||
      donation.currency !== 'usd'
    ) {
      throw new Error('Invalid public donation or unsupported currency')
    }
    if (seen.has(donation.id)) continue
    seen.add(donation.id)
    summary.donations++
    summary.totalAmount += donation.amount
    const name = donation.fullName?.trim()
    if (name) {
      named.set(name, (named.get(name) ?? 0) + donation.amount)
    } else {
      summary.anonymousDonations++
      tiers.find((tier) => tier.id === patronClass(donation.amount))!
        .anonymousDonations++
    }
  }
  summary.namedPatrons = named.size
  for (const [name, amount] of named) {
    tiers.find((tier) => tier.id === patronClass(amount))!.names.push(name)
  }
  // Recognition within a class is alphabetical, with no individual gift amounts.
  for (const tier of tiers) {
    tier.names.sort((a, b) => a.localeCompare(b, 'en'))
  }
  return { summary, tiers }
}
