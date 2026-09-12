import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  END_MARK,
  START_MARK,
  TIERS,
  replaceSections,
  tierMembers,
  tierSections,
} from './zeffy-patrons.mjs'

const donation = (fullName, dollars) => ({ fullName, amount: dollars * 100 })

test('donations round down to the nearest tier point', () => {
  const members = tierMembers(
    [
      donation('Exactly Eight', 8192),
      donation('Nearly Eight', 8191),
      donation('Custom Amount', 500),
      donation('Floor', 16),
      donation('Below Floor', 15),
    ],
    [],
  )
  assert.deepEqual(
    Object.fromEntries(
      TIERS.map((t) => [t.name, members.get(t.id).map((m) => m.name)]),
    ),
    {
      '8K': ['Exactly Eight'],
      '2K': ['Nearly Eight'],
      '256B': ['Custom Amount'],
      '16B': ['Floor'],
    },
  )
})

test('a repeat donor counts once, with donations summed', () => {
  const members = tierMembers(
    [donation('Twice Giver', 15), donation('Twice Giver', 15)],
    [],
  )
  assert.deepEqual(
    members.get('patrons-16b').map((m) => m.name),
    ['Twice Giver'],
  )
})

test('anonymous donations stay off the list', () => {
  const members = tierMembers(
    [
      { fullName: null, amount: 819200 },
      { fullName: '  ', amount: 819200 },
    ],
    [],
  )
  for (const tier of TIERS) assert.equal(members.get(tier.id).length, 0)
})

test('tiers order largest total first and escape markup in names', () => {
  const html = tierSections([
    donation('Larger Giver', 300),
    donation('<script>alert(1)</script>', 256),
  ])
  assert.ok(html.startsWith(START_MARK) && html.endsWith(END_MARK))
  assert.ok(!html.includes('<script>'))
  assert.ok(
    html.indexOf('Larger Giver') <
      html.indexOf('&#60;script&#62;alert(1)&#60;/script&#62;'),
  )
})

test('off-platform patrons join their tier', () => {
  const members = tierMembers([])
  assert.ok(members.get('patrons-8k').some((m) => m.name === 'Zeno'))
})

test('replaceSections swaps exactly the generated span', () => {
  const page = `<p>before</p>\n${START_MARK}\nold\n${END_MARK}\n<p>after</p>`
  assert.equal(
    replaceSections(page, `${START_MARK}\nnew\n${END_MARK}`),
    `<p>before</p>\n${START_MARK}\nnew\n${END_MARK}\n<p>after</p>`,
  )
  assert.equal(replaceSections('<p>no markers</p>', 'x'), null)
})
