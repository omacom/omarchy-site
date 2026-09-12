/** Verify built React islands with a browser deliberately missing locale data.
 *  Run after building English and the selected locale (Albanian by default). */
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import locales from '../src/i18n/locales.json' with { type: 'json' }
import meetups from '../src/data/meetups.json' with { type: 'json' }
import momentum from '../src/data/momentum.json' with { type: 'json' }

const codes = process.argv.slice(2)
if (!codes.length) codes.push('en', 'sq')
const contentTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
}
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
})
try {
  for (const code of codes) {
    assert.ok(locales[code], `Unknown locale: ${code}`)
    const root = path.resolve(code === 'en' ? 'dist/client' : `dist/${code}`)
    await stat(path.join(root, 'index.html'))
    const server = createServer(async (req, res) => {
      try {
        const pathname = decodeURIComponent(
          new URL(req.url, 'http://localhost').pathname,
        )
        let file = path.resolve(root, `.${pathname}`)
        if (!file.startsWith(root + path.sep) && file !== root) {
          res.writeHead(403).end()
          return
        }
        if ((await stat(file)).isDirectory())
          file = path.join(file, 'index.html')
        res.setHeader(
          'Content-Type',
          contentTypes[path.extname(file)] ?? 'application/octet-stream',
        )
        res.end(await readFile(file))
      } catch {
        res.writeHead(404).end()
      }
    })
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    const origin = `http://127.0.0.1:${server.address().port}`
    try {
      for (const width of [1440, 390]) {
        for (const [url, component, selector] of [
          ['/', 'HomePage', '#figures'],
          ['/meetups/', 'MeetupsPage', 'main'],
        ]) {
          const page = await browser.newPage({
            viewport: { width, height: 1000 },
            reducedMotion: 'reduce',
          })
          const errors = []
          page.on('pageerror', (error) => errors.push(error.message))
          page.on('console', (message) => {
            if (
              message.type() === 'error' &&
              /hydration|didn't match|did not match/i.test(message.text())
            )
              errors.push(message.text())
          })
          await page.addInitScript(
            ({ refreshed }) => {
              Date.now = () => Date.parse(`${refreshed}T00:00:00Z`)
              // Simulate the fallback regardless of the browser/OS's installed ICU data.
              for (const name of [
                'NumberFormat',
                'DateTimeFormat',
                'DisplayNames',
              ]) {
                const Native = Intl[name]
                Intl[name] = new Proxy(Native, {
                  construct(target, [, options]) {
                    return new target('en-US', options)
                  },
                  apply(target, thisArg, [, options]) {
                    return Reflect.apply(target, thisArg, ['en-US', options])
                  },
                })
              }
              const number = Number.prototype.toLocaleString
              Number.prototype.toLocaleString = function (_, options) {
                return number.call(this, 'en-US', options)
              }
              const date = Date.prototype.toLocaleDateString
              Date.prototype.toLocaleDateString = function (_, options) {
                return date.call(this, 'en-US', options)
              }
            },
            { refreshed: meetups.refreshed },
          )
          // Hold hydration until we've captured the actual server DOM.
          let releaseScripts
          const scripts = new Promise((resolve) => {
            releaseScripts = resolve
          })
          await page.route('**/*', async (route) => {
            const request = route.request()
            if (!request.url().startsWith(origin)) return route.abort()
            if (request.resourceType() === 'script') await scripts
            return route.continue()
          })
          await page.goto(origin + url, { waitUntil: 'commit' })
          await page.locator(selector).waitFor({ state: 'attached' })
          await page.evaluate((selector) => {
            window.serverMain = document.querySelector('main')
            window.serverTarget = document.querySelector(selector)
            window.serverTimes = [...document.querySelectorAll('main time')]
            window.serverTimeText = window.serverTimes.map(
              (node) => node.textContent,
            )
            window.serverTargetText = window.serverTarget.textContent
          }, selector)
          releaseScripts()
          const island = `astro-island[component-export="${component}"]`
          await page.waitForFunction((selector) => {
            const node = document.querySelector(selector)
            return node && !node.hasAttribute('ssr')
          }, island)
          // Astro removes its marker after calling hydrateRoot; React may
          // still have a scheduled render to commit on the next frame.
          await page.evaluate(
            () =>
              new Promise((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(resolve)),
              ),
          )
          assert.deepEqual(
            await page.evaluate(
              (selector) => ({
                mainPreserved:
                  window.serverMain === document.querySelector('main'),
                targetPreserved:
                  window.serverTarget === document.querySelector(selector),
                textPreserved:
                  window.serverTargetText ===
                  document.querySelector(selector).textContent,
                timesPreserved: window.serverTimes.every(
                  (node, i) =>
                    node.isConnected &&
                    node.textContent === window.serverTimeText[i],
                ),
              }),
              selector,
            ),
            {
              mainPreserved: true,
              targetPreserved: true,
              textPreserved: true,
              timesPreserved: true,
            },
            `${code} ${url} ${width}: server DOM changed during hydration`,
          )
          if (component === 'HomePage') {
            await page.emulateMedia({ reducedMotion: 'no-preference' })
            await page.locator('#figures').scrollIntoViewIfNeeded()
            await page.waitForFunction(
              () =>
                document.querySelectorAll('#figures .figure-live').length === 3,
            )
            await page.waitForTimeout(1250)
            const final = new Intl.NumberFormat(
              locales[code].formatLocale,
            ).format(momentum.foundation.total * 1_000_000)
            assert.ok(
              (await page.locator('#figures').innerText()).includes(final),
              'animation must finish with the build locale',
            )
            if (width === 1440) {
              await page
                .locator('#figures .absolute.inset-0 .flex.h-full > span')
                .last()
                .hover()
              const date = new Intl.DateTimeFormat(locales[code].formatLocale, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                timeZone: 'UTC',
              }).format(new Date(`${momentum.checked}T00:00:00Z`))
              await page.getByText(date, { exact: false }).last().waitFor()
            }
          } else {
            const regions = page.locator('main nav button')
            if ((await regions.count()) > 1) {
              await regions.nth(1).click()
              assert.equal(
                await regions.nth(1).getAttribute('aria-pressed'),
                'true',
              )
              await regions.first().click()
              assert.equal(
                await regions.first().getAttribute('aria-pressed'),
                'true',
              )
            }
          }
          assert.deepEqual(
            errors,
            [],
            `${code} ${url} ${width}: browser errors`,
          )
          await page.close()
          console.log(
            `${code} ${url} ${width}px: server DOM, localized text, hydration and interactions verified`,
          )
        }
      }
    } finally {
      await new Promise((resolve) => server.close(resolve))
    }
  }
} finally {
  await browser.close()
}
