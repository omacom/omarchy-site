#!/usr/bin/env node
/**
 * The world's countries as SVG paths, and a place on them for every meetup,
 * for the meetups page. Built here, at build time, from Natural Earth's
 * country shapes (the world-atlas package) and src/data/meetups.json, into
 * src/data/meetup-map.json: one path per country, by its two-letter code,
 * and each pin's position, so the page draws it as an inline SVG in the
 * theme's own inks and the browser never loads a map library. Equal Earth,
 * so no country is drawn at a size it does not have.
 *
 * Run: node scripts/meetup-map.mjs   (part of npm run port)
 */
import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { geoContains, geoEqualEarth, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'

const require = createRequire(import.meta.url)
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA = path.join(ROOT, 'src/data')

/** The drawing's size, in its own units. */
const WIDTH = 1000

/**
 * Natural Earth draws borders by who holds the ground, but not evenly: it
 * keeps occupied Donetsk, Luhansk, Transnistria, Abkhazia and South Ossetia
 * inside Ukraine, Moldova and Georgia, and gives Crimea alone to Russia.
 * Hand Crimea back so the map draws every occupied territory the same way,
 * within its internationally recognized country (UN GA resolution 68/262).
 * The polygon is picked by the point it contains, Simferopol, not by index.
 */
const CRIMEA = [34.1, 44.95]
function returnCrimea(features) {
  const russia = features.find((f) => f.id === '643')
  const ukraine = features.find((f) => f.id === '804')
  if (russia?.geometry.type !== 'MultiPolygon' || !ukraine) return
  const contains = (rings) =>
    geoContains({ type: 'Polygon', coordinates: rings }, CRIMEA)
  const crimea = russia.geometry.coordinates.filter(contains)
  if (crimea.length === 0) return
  russia.geometry.coordinates = russia.geometry.coordinates.filter(
    (rings) => !contains(rings),
  )
  ukraine.geometry = {
    type: 'MultiPolygon',
    coordinates: [
      ...(ukraine.geometry.type === 'MultiPolygon'
        ? ukraine.geometry.coordinates
        : [ukraine.geometry.coordinates]),
      ...crimea,
    ],
  }
}

const atlas = require('world-atlas/countries-110m.json')
const countries = require('world-countries')
const meetups = JSON.parse(
  await readFile(path.join(DATA, 'meetups.json'), 'utf8'),
)

// Natural Earth names countries by their numeric code; the site by their
// two-letter one.
const alpha2 = new Map(countries.map((c) => [c.ccn3, c.cca2]))
const land = feature(atlas, atlas.objects.countries)
land.features = land.features.filter((f) => f.id !== '010')
returnCrimea(land.features)

const projection = geoEqualEarth().fitWidth(WIDTH, land)
const [[, top], [, bottom]] = geoPath(projection).bounds(land)
const HEIGHT = Math.ceil(bottom - top)
projection.translate([
  projection.translate()[0],
  projection.translate()[1] - top,
])
const draw = geoPath(projection, null)
const round = (d) =>
  d.replace(/-?\d+\.\d+/g, (n) => String(Math.round(Number(n) * 10) / 10))

const shapes = []
for (const f of land.features) {
  const code = alpha2.get(f.id)
  const d = draw(f)
  if (!code || !d) continue
  shapes.push({ id: code, d: round(d) })
}

const pins = []
for (const event of meetups.events) {
  if (!event.geo) continue
  const at = projection([event.geo.lon, event.geo.lat])
  if (!at) continue
  pins.push({
    id: event.id,
    x: Math.round(at[0] * 10) / 10,
    y: Math.round(at[1] * 10) / 10,
  })
}

await writeFile(
  path.join(DATA, 'meetup-map.json'),
  JSON.stringify({ width: WIDTH, height: HEIGHT, countries: shapes, pins }),
)
console.log(
  `meetup-map.json: ${shapes.length} countries, ${pins.length} pins, ${WIDTH}x${HEIGHT}`,
)
