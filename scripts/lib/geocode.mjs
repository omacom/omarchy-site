/**
 * Where a meetup is, from its title alone, for the ones whose address the
 * calendar keeps for its guests. The title nearly always names the city
 * ("Omarchy Meetup São Paulo", "Omarchy TOKYO Night"), so the words that
 * are not a place are dropped and what is left is asked of OpenStreetMap.
 * Only an answer that is a place, a city, a town, a region or a country,
 * is taken; a shop that happens to be called Meet is not. The answer is
 * marked approximate: it is the city, not the venue.
 */
const NOISE =
  /omarch\w*|\bmeet ?ups?\b|\bmeet\b|\bnight\b|\bhack\b|\blinux\b|\bcommunity\b|\bedition\b|\bevent\b|\bv\d[\d.]*\b|#\d+|\b\d{3}\b|[\p{Emoji_Presentation}\p{Extended_Pictographic}]/giu

const PLACE_TYPES = new Set([
  'city',
  'town',
  'village',
  'municipality',
  'state',
  'province',
  'region',
  'county',
  'country',
  'administrative',
  'suburb',
  'city_district',
  'island',
])

/** The parts of a title that could be a place, one per segment of it,
 *  the segments being what colons, dashes and slashes set apart. */
export function placeWords(title) {
  return title
    .replace(NOISE, ' ')
    .split(/[:\-\/|–]/)
    .map((part) =>
      part
        .replace(/[^\p{L}\p{N} ]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter((part) => part.length >= 3)
}

let lastAsk = 0

/** Asks OpenStreetMap where a title's place is. One request a second at
 *  most, as its terms ask, with a name to be reached at. */
export async function geocodeTitle(title) {
  for (const query of placeWords(title)) {
    const found = await ask(query)
    if (found) return found
  }
  return null
}

async function ask(query) {
  const wait = lastAsk + 1100 - Date.now()
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastAsk = Date.now()
  const url =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=' +
    encodeURIComponent(query)
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'omarchy-site meetups map (https://github.com/omacom/omarchy-site)',
    },
  })
  if (!res.ok) return null
  const [hit] = await res.json()
  // A place by its type, or a boundary: a country's record can come back
  // as a historic boundary rather than a place.
  if (!hit) return null
  if (!PLACE_TYPES.has(hit.addresstype) && hit.category !== 'boundary')
    return null
  const address = hit.address ?? {}
  const city =
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    null
  return {
    lat: Number(hit.lat),
    lon: Number(hit.lon),
    city: ['city', 'town', 'village', 'municipality'].includes(hit.addresstype)
      ? (city ?? hit.name ?? null)
      : city,
    country: (address.country_code ?? '').toUpperCase() || null,
  }
}
