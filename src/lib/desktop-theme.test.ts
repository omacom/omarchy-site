import assert from 'node:assert/strict'
import { test } from 'node:test'
import { siteThemeFor } from './desktop-theme.ts'
import { SITE_THEMES } from './site-themes.ts'

const IDS = SITE_THEMES.map((t) => t.id)

test('the theme the extension names is the theme this site ships', () => {
  // What omarchy-theme-sync publishes is the directory name under
  // /usr/share/omarchy/themes, which is what SITE_THEMES ids are.
  for (const id of IDS) assert.equal(siteThemeFor(id, IDS), id)
})

test('a name is matched however it was spelled', () => {
  assert.equal(siteThemeFor('Rose Pine', IDS), 'rose-pine')
  assert.equal(siteThemeFor('  TOKYO-NIGHT  ', IDS), 'tokyo-night')
  assert.equal(siteThemeFor('matte_black', IDS), 'matte-black')
})

test('an inexact match is not a match', () => {
  // Somebody running a community theme is not running one of ours, and
  // guessing would dress the site in colours their desktop is not wearing.
  for (const name of [
    'gruvbox-dark',
    'gruvbox dark',
    'tokyo',
    'catppuccin-mocha',
    'rose',
  ]) {
    assert.equal(siteThemeFor(name, IDS), null, name)
  }
})

test('nothing published is nothing matched', () => {
  for (const empty of [null, undefined, '', '   ', '-', '_']) {
    assert.equal(siteThemeFor(empty, IDS), null, JSON.stringify(empty))
  }
})

test('the whole list is matchable, so a new theme cannot quietly not sync', () => {
  // The hinge of the feature: every id here is a directory name under
  // `themes/` in omacom/omarchy, which is the name the extension publishes.
  // A theme added with an id that is not its Omarchy directory would look
  // fine on the site and silently never follow a desktop.
  assert.equal(new Set(IDS).size, IDS.length, 'two themes share an id')
  for (const id of IDS) {
    assert.match(
      id,
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      `${id} is not a directory name`,
    )
  }
})
