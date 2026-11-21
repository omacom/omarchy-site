/** Plain names for when the runtime cannot name a script in the reader's language. */
export const SCRIPT_NAMES: Record<string, string> = {
  Latn: 'Latin',
  Grek: 'Greek',
  Cyrl: 'Cyrillic',
  Armn: 'Armenian',
  Geor: 'Georgian',
  Hebr: 'Hebrew',
  Arab: 'Arabic',
  Ethi: 'Ethiopic',
  Deva: 'Devanagari',
  Beng: 'Bangla',
  Guru: 'Gurmukhi',
  Gujr: 'Gujarati',
  Orya: 'Odia',
  Taml: 'Tamil',
  Telu: 'Telugu',
  Knda: 'Kannada',
  Mlym: 'Malayalam',
  Sinh: 'Sinhala',
  Thai: 'Thai',
  Laoo: 'Lao',
  Mymr: 'Myanmar',
  Khmr: 'Khmer',
  Tibt: 'Tibetan',
  Hans: 'Simplified Chinese',
  Hant: 'Traditional Chinese',
  Jpan: 'Japanese',
  Kore: 'Korean',
}

/** Scripts whose own name is a bare adjective - "Simplified", "Traditional" -
 *  and read better as the language they write: "Simplified Chinese". */
const SCRIPT_AS_LANGUAGE: Record<string, string> = {
  Hans: 'zh-Hans',
  Hant: 'zh-Hant',
}

/**
 * A script's name as a group heading, in the reader's language where the
 * runtime knows it. Intl hands nothing back when it has no name, and throws
 * on a locale it does not know; both fall to the English table, then the code.
 */
export function scriptName(script: string, displayLocale: string): string {
  try {
    const languageTag = SCRIPT_AS_LANGUAGE[script]
    const named = languageTag
      ? new Intl.DisplayNames([displayLocale, 'en'], {
          type: 'language',
          languageDisplay: 'dialect',
          fallback: 'none',
        }).of(languageTag)
      : new Intl.DisplayNames([displayLocale, 'en'], {
          type: 'script',
          fallback: 'none',
        }).of(script)
    if (named) return named
  } catch {
    // An Intl without DisplayNames, or a locale it cannot resolve.
  }
  return SCRIPT_NAMES[script] ?? script
}
