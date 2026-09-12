import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatMeetups } from './meetup-data.ts'
import type { Meetup } from './meetup-data.ts'

const event: Meetup = {
  id: 'tirana',
  title: 'Omarchy Tirana',
  url: 'https://example.com/tirana',
  start: '2026-09-30T23:30:00Z',
  timezone: 'Europe/Tirane',
  city: 'Tiranë',
  country: 'AL',
  address: null,
  cover: null,
  geo: null,
}

test('meetup labels retain the event time zone, Albanian month and country after serialization', () => {
  const data = JSON.parse(
    JSON.stringify(
      formatMeetups(
        {
          refreshed: '2026-09-30',
          events: [event],
        },
        'sq-AL',
      ),
    ),
  )
  const meetup = data.events[0]
  assert.equal(meetup.start, event.start)
  assert.equal(meetup.url, event.url)
  assert.equal(data.refreshed, '2026-09-30')
  assert.equal(data.countries.AL, 'Shqipëri')
  assert.equal(meetup.where, 'Tiranë, Shqipëri')
  assert.match(meetup.month, /tetor 2026/)
  assert.match(meetup.fullDate, /1.*tet.*2026/)
  assert.match(meetup.when, /1.*tet.*1:30 p\.d\./)
})

test('calendar locations keep address, hidden-country and invalid-country fallbacks', () => {
  const calendar = formatMeetups(
    {
      refreshed: '2026-09-30',
      events: [
        { ...event, city: 'Tiranë, Shqipëri' },
        { ...event, city: null, address: 'Venue address' },
        { ...event, city: null, address: null, country: null, timezone: null },
        { ...event, city: null, country: 'invalid' },
      ],
    },
    'sq-AL',
  )
  assert.deepEqual(
    calendar.events.map((e) => e.where),
    ['Tiranë, Shqipëri', 'Venue address', '', 'invalid'],
  )
  assert.match(calendar.events[2].month, /shtator 2026/)
  assert.match(calendar.events[2].when, /11:30 m\.d\./)
})
