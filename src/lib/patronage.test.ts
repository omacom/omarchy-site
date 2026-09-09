import assert from 'node:assert/strict'
import { test } from 'node:test'
import { patronClass, summarizePatronage } from './patronage.ts'

test('badge classes use the published USD thresholds, including custom gifts', () => {
  for (const [amount, tier] of [
    [0, 'other'],
    [1599, 'other'],
    [1600, '016'],
    [25599, '016'],
    [25600, '256'],
    [204799, '256'],
    [204800, '2k'],
    [819199, '2k'],
    [819200, '8k'],
    [1000000, '8k'],
  ] as const)
    assert.equal(patronClass(amount), tier)
})

test('totals deduplicate donations and classify cumulative displayed names without combining anonymous gifts', () => {
  const donation = (id: string, fullName: string | null, amount: number) => ({
    id,
    fullName,
    amount,
    currency: 'usd',
  })
  const rows = [
    donation('a', ' Alex ', 12800),
    donation('b', 'Alex', 12800),
    donation('c', null, 12800),
    donation('d', ' ', 12800),
    donation('e', 'Zoë', 500),
    donation('f', '<script>alert(1)</script>', 1600),
  ]
  const { summary, tiers } = summarizePatronage([...rows, rows[0]])
  assert.deepEqual(summary, {
    namedPatrons: 3,
    anonymousDonations: 2,
    donations: 6,
    totalAmount: 53300,
    currency: 'usd',
  })
  assert.deepEqual(tiers.find((t) => t.id === '256')?.names, ['Alex'])
  assert.equal(tiers.find((t) => t.id === '016')?.anonymousDonations, 2)
  assert.deepEqual(tiers.find((t) => t.id === 'other')?.names, ['Zoë'])
  assert.ok(
    tiers
      .find((t) => t.id === '016')
      ?.names.includes('<script>alert(1)</script>'),
  )
})

test('bad or mixed-currency data cannot silently corrupt the displayed USD total', () => {
  const good = { id: 'a', fullName: 'Alex', amount: 1600, currency: 'usd' }
  for (const bad of [
    { ...good, currency: 'eur' },
    { ...good, amount: -100 },
    { ...good, amount: 16.5 },
    { ...good, amount: NaN },
    { ...good, id: '' },
  ])
    assert.throws(() => summarizePatronage([bad]))
  assert.equal(summarizePatronage([]).summary.totalAmount, 0)
})
