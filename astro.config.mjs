import locales from './src/i18n/locales.json' with { type: 'json' }
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { devPassthrough } from './scripts/dev-passthrough.mjs'
import { devPlEditor } from './scripts/dev-pl-editor.mjs'

const language = process.env.PUBLIC_SITE_LOCALE || 'en'
if (!Object.hasOwn(locales, language))
  throw new Error(`Unknown site language: ${language}`)

// The static assembler and deployment workflows share dist/client.
export default defineConfig({
  server: { port: 3113 },
  output: 'static',
  site: locales[language].domain,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  outDir: language === 'en' ? './dist/client' : `./dist/${language}`,
  integrations: [react()],
  vite: {
    plugins: [tailwindcss(), devPassthrough(), devPlEditor()],
    optimizeDeps: { entries: ['!src/parked/**'] },
    resolve: {
      // Array form: exact entries first, so the shims win over the prefixes.
      alias: [
        {
          find: './current-messages.ts',
          replacement: path.resolve(
            `./src/i18n/messages/${locales[language].contentLocale ?? language}.json`,
          ),
        },
        {
          find: '@/lib/content',
          replacement: path.resolve('./src/astro/content-client.ts'),
        },
        {
          find: '@/lib/plugins',
          replacement: path.resolve('./src/astro/plugins-client.ts'),
        },
        {
          find: '@tanstack/react-router',
          replacement: path.resolve('./src/astro/router-shim.tsx'),
        },
        { find: '@', replacement: path.resolve('./src') },
        { find: '#', replacement: path.resolve('./src') },
      ],
    },
  },
})
