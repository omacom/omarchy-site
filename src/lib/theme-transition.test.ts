import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  prefersReducedMotion,
  runThemeViewTransition,
  shouldAnimateThemeTransition,
} from './theme-transition.ts'

test('prefersReducedMotion follows the media query', () => {
  assert.equal(prefersReducedMotion({ matches: true }), true)
  assert.equal(prefersReducedMotion({ matches: false }), false)
})

test('shouldAnimateThemeTransition needs the API and motion', () => {
  const capable = { startViewTransition: () => {} }
  assert.equal(shouldAnimateThemeTransition(capable, false), true)
  assert.equal(shouldAnimateThemeTransition(capable, true), false)
  assert.equal(shouldAnimateThemeTransition({}, false), false)
})

test('runThemeViewTransition updates immediately without the API', () => {
  const calls: string[] = []
  runThemeViewTransition(() => calls.push('update'), {}, false)
  assert.deepEqual(calls, ['update'])
})

test('runThemeViewTransition updates immediately when motion is reduced', () => {
  const calls: string[] = []
  runThemeViewTransition(
    () => calls.push('update'),
    { startViewTransition: () => calls.push('transition') },
    true,
  )
  assert.deepEqual(calls, ['update'])
})

test('runThemeViewTransition starts a view transition when the API is there', () => {
  const calls: string[] = []
  runThemeViewTransition(
    () => calls.push('update'),
    {
      startViewTransition: (update) => {
        calls.push('transition')
        update()
      },
    },
    false,
  )
  assert.deepEqual(calls, ['transition', 'update'])
})

test('runThemeViewTransition still updates if startViewTransition throws', () => {
  const calls: string[] = []
  runThemeViewTransition(
    () => calls.push('update'),
    {
      startViewTransition: () => {
        throw new Error('already transitioning')
      },
    },
    false,
  )
  assert.deepEqual(calls, ['update'])
})
