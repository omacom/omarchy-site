import manualJson from '../data/manual.json'
import { contentLocale } from '../i18n/site'

export type ManualChapter = { slug: string; title: string; html: string }

// A language with a translated manual (bin/build-manual, scripts/port_content.py)
// shows it in place of the English one.
const translations = import.meta.glob<Array<ManualChapter>>(
  '../i18n/*/manual.json',
  {
    import: 'default',
    eager: true,
  },
)

export const manualChapters: Array<ManualChapter> =
  translations[`../i18n/${contentLocale}/manual.json`] ??
  (manualJson as Array<ManualChapter>)
