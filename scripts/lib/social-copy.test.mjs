import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import locales from '../../src/i18n/locales.json' with { type: 'json' }
import { SITE_THEMES } from '../../src/lib/site-themes.ts'
import { socialCopies, socialCopy } from './social-copy.mjs'
import { validateSocialCharacters } from './social-labels.mjs'

test('every language has complete, renderable social-card text', () => {
  assert.deepEqual(Object.keys(socialCopies), Object.keys(locales))
  for (const [code, copy] of Object.entries(socialCopies)) {
    assert.equal(copy.lines.length, 3)
    assert.ok(copy.lines.every((line) => line.trim()))
    assert.ok(!copy.lines[0].includes('Omarchy'))
    validateSocialCharacters(code)
  }
  assert.equal(socialCopies.ar.direction, 'rtl')
  assert.equal(socialCopies.ur.direction, 'rtl')
  assert.throws(() => socialCopy('missing'), /Unknown social-card language/)
  assert.throws(
    () => validateSocialCharacters('da', { lines: ['🦄'] }),
    /Missing da social-card glyph/,
  )
})

test('every language and theme has a 1200x630 PNG', () => {
  for (const code of Object.keys(locales)) {
    for (const theme of SITE_THEMES) {
      const content = locales[code].contentLocale ?? code
      const path = `${content === 'en' ? '' : `${content}/`}${theme.id}.png`
      const image = readFileSync(
        new URL(`../../public/brand/social/${path}`, import.meta.url),
      )
      assert.equal(
        image.subarray(0, 8).toString('hex'),
        '89504e470d0a1a0a',
        path,
      )
      assert.equal(image.readUInt32BE(16), 1200, path)
      assert.equal(image.readUInt32BE(20), 630, path)
    }
  }
})

test('all scripts render identically without installed system fonts', async () => {
  const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const { execFileSync } = await import('node:child_process')
  const directory = mkdtempSync(join(tmpdir(), 'social-fonts-'))
  try {
    const config = join(directory, 'fonts.conf')
    writeFileSync(config, '<?xml version="1.0"?><fontconfig></fontconfig>')
    const script = `
      import { createHash } from 'node:crypto';
      import { socialLabelMasks } from ${JSON.stringify(new URL('./social-labels.mjs', import.meta.url).href)};
      const masks = await socialLabelMasks();
      console.log(createHash('sha256').update(JSON.stringify(masks)).digest('hex'));
    `
    const render = (env) =>
      execFileSync(process.execPath, ['--input-type=module', '-e', script], {
        env,
        encoding: 'utf8',
      })
    assert.equal(
      render({ ...process.env, FONTCONFIG_FILE: config }),
      render(process.env),
    )
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
