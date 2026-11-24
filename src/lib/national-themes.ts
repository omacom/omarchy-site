/**
 * A theme for every country with a site of its own, drawn from its flag:
 * the page's ground leans toward the flag's `base` colour, and `accent`
 * is the brand colour for buttons, links, the wordmark and the pixel
 * field. Every other token is derived the way the stock themes shape
 * theirs, so a national theme looks like any other Omarchy theme.
 */

export type NationalTheme = {
  /** The country the language's site stands for, as an ISO code. */
  country: string
  id: string
  /** The country's name in its own language. */
  name: string
  base: string
  accent: string
  /** A light ground, where the flag's own field is white. */
  light?: true
}

export const NATIONAL_THEMES: NationalTheme[] = [
  {
    country: 'AD',
    id: 'andorra',
    name: 'Andorra',
    base: '#10069F',
    accent: '#FEDF00',
  },
  {
    country: 'AE',
    id: 'emirates',
    name: 'الإمارات',
    base: '#00732F',
    accent: '#FF0000',
  },
  {
    country: 'BA',
    id: 'bosna',
    name: 'Bosna i Hercegovina',
    base: '#002395',
    accent: '#FECB00',
  },
  {
    country: 'BD',
    id: 'bangladesh',
    name: 'বাংলাদেশ',
    base: '#006A4E',
    accent: '#F42A41',
  },
  {
    country: 'BG',
    id: 'balgariya',
    name: 'България',
    base: '#00966E',
    accent: '#D62612',
  },
  {
    country: 'BR',
    id: 'brasil',
    name: 'Brasil',
    base: '#009440',
    accent: '#FFCB00',
  },
  {
    country: 'CN',
    id: 'zhongguo',
    name: '中国',
    base: '#DE2910',
    accent: '#FFDE00',
  },
  {
    country: 'CZ',
    id: 'cesko',
    name: 'Česko',
    base: '#11457E',
    accent: '#D7141A',
  },
  {
    country: 'DE',
    id: 'deutschland',
    name: 'Deutschland',
    base: '#DD0000',
    accent: '#FFCE00',
  },
  {
    country: 'DK',
    id: 'danmark',
    name: 'Danmark',
    base: '#C8102E',
    accent: '#C8102E',
  },
  {
    country: 'EE',
    id: 'eesti',
    name: 'Eesti',
    base: '#0072CE',
    accent: '#0072CE',
  },
  {
    country: 'FI',
    id: 'suomi',
    name: 'Suomi',
    base: '#002F6C',
    accent: '#FFFFFF',
  },
  {
    country: 'FR',
    id: 'france',
    name: 'France',
    base: '#000091',
    accent: '#E1000F',
  },
  {
    country: 'GR',
    id: 'hellas',
    name: 'Ελλάδα',
    base: '#0D5EAF',
    accent: '#FFFFFF',
  },
  {
    country: 'HR',
    id: 'hrvatska',
    name: 'Hrvatska',
    base: '#171796',
    accent: '#FF0000',
  },
  {
    country: 'HU',
    id: 'magyarorszag',
    name: 'Magyarország',
    base: '#436F4D',
    accent: '#CD2A3E',
  },
  {
    country: 'ID',
    id: 'indonesia',
    name: 'Indonesia',
    base: '#FF0000',
    accent: '#FF0000',
  },
  {
    country: 'IE',
    id: 'eire',
    name: 'Éire',
    base: '#169B62',
    accent: '#FF883E',
  },
  {
    country: 'IL',
    id: 'israel',
    name: 'ישראל',
    base: '#0038B8',
    accent: '#0038B8',
    light: true,
  },
  {
    country: 'IN',
    id: 'bharat',
    name: 'भारत',
    base: '#138808',
    accent: '#FF9933',
  },
  {
    country: 'IR',
    id: 'iran',
    name: 'ایران',
    base: '#239F40',
    accent: '#DA0000',
  },
  {
    country: 'IS',
    id: 'island',
    name: 'Ísland',
    base: '#02529C',
    accent: '#DC1E35',
  },
  {
    country: 'IT',
    id: 'italia',
    name: 'Italia',
    base: '#009246',
    accent: '#CE2B37',
  },
  {
    country: 'JP',
    id: 'nippon',
    name: '日本',
    base: '#BC002D',
    accent: '#BC002D',
    light: true,
  },
  {
    country: 'KR',
    id: 'hanguk',
    name: '대한민국',
    base: '#0047A0',
    accent: '#CD2E3A',
    light: true,
  },
  {
    country: 'LK',
    id: 'srilanka',
    name: 'Sri Lanka',
    base: '#8D153A',
    accent: '#FFBE29',
  },
  {
    country: 'LT',
    id: 'lietuva',
    name: 'Lietuva',
    base: '#006A44',
    accent: '#FDB913',
  },
  {
    country: 'LV',
    id: 'latvija',
    name: 'Latvija',
    base: '#9D2235',
    accent: '#9D2235',
  },
  {
    country: 'MX',
    id: 'mexico',
    name: 'México',
    base: '#006847',
    accent: '#CE1126',
  },
  {
    country: 'MY',
    id: 'malaysia',
    name: 'Malaysia',
    base: '#000066',
    accent: '#FFCC00',
  },
  {
    country: 'NL',
    id: 'nederland',
    name: 'Nederland',
    base: '#21468B',
    accent: '#AE1C28',
  },
  {
    country: 'NO',
    id: 'norge',
    name: 'Norge',
    base: '#BA0C2F',
    accent: '#BA0C2F',
  },
  {
    country: 'PH',
    id: 'pilipinas',
    name: 'Pilipinas',
    base: '#0038A8',
    accent: '#FCD116',
  },
  {
    country: 'PK',
    id: 'pakistan',
    name: 'پاکستان',
    base: '#01411C',
    accent: '#FFFFFF',
  },
  {
    country: 'PL',
    id: 'polska',
    name: 'Polska',
    base: '#DC143C',
    accent: '#DC143C',
  },
  {
    country: 'PT',
    id: 'portugal',
    name: 'Portugal',
    base: '#046A38',
    accent: '#DA291C',
  },
  {
    country: 'RO',
    id: 'romania',
    name: 'România',
    base: '#002B7F',
    accent: '#FCD116',
  },
  {
    country: 'RS',
    id: 'srbija',
    name: 'Србија',
    base: '#0C4076',
    accent: '#C6363C',
  },
  {
    country: 'RU',
    id: 'rossiya',
    name: 'Россия',
    base: '#0039A6',
    accent: '#D52B1E',
  },
  {
    country: 'SE',
    id: 'sverige',
    name: 'Sverige',
    base: '#006AA7',
    accent: '#FECC02',
  },
  {
    country: 'SI',
    id: 'slovenija',
    name: 'Slovenija',
    base: '#003DA5',
    accent: '#D50032',
  },
  {
    country: 'SK',
    id: 'slovensko',
    name: 'Slovensko',
    base: '#254AA5',
    accent: '#ED1C24',
  },
  {
    country: 'TH',
    id: 'thai',
    name: 'ไทย',
    base: '#2D2A4A',
    accent: '#A51931',
  },
  {
    country: 'TR',
    id: 'turkiye',
    name: 'Türkiye',
    base: '#E30A17',
    accent: '#E30A17',
  },
  {
    country: 'TW',
    id: 'taiwan',
    name: '臺灣',
    base: '#FE0000',
    accent: '#FE0000',
  },
  {
    country: 'TZ',
    id: 'tanzania',
    name: 'Tanzania',
    base: '#1EB53A',
    accent: '#FCD116',
  },
  {
    country: 'UA',
    id: 'ukrayina',
    name: 'Україна',
    base: '#0057B7',
    accent: '#FFD700',
  },
  {
    country: 'UZ',
    id: 'ozbekiston',
    name: 'Oʻzbekiston',
    base: '#0099B5',
    accent: '#1EB53A',
  },
  {
    country: 'VN',
    id: 'vietnam',
    name: 'Việt Nam',
    base: '#DA251D',
    accent: '#FFFF00',
  },
]

type Oklch = [l: number, c: number, h: number]

const toLinear = (v: number) =>
  v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
const toGamma = (v: number) =>
  v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055

function rgbOf(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return [n >> 16, (n >> 8) & 255, n & 255].map((v) => toLinear(v / 255))
}

function oklchOf(hex: string): Oklch {
  const [r, g, b] = rgbOf(hex)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return [L, Math.hypot(A, B), Math.atan2(B, A)]
}

/** An OKLCH colour as hex, its channels clamped into sRGB. */
function hexOf([L, C, h]: Oklch) {
  const A = C * Math.cos(h)
  const B = C * Math.sin(h)
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  return `#${rgb
    .map((v) => Math.round(toGamma(Math.min(1, Math.max(0, v))) * 255))
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`
}

/** WCAG contrast between two hex colours. */
export function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const [r, g, b] = rgbOf(hex)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Part way from one colour to another, in OKLab. */
function mix(from: string, to: string, t: number) {
  const [l1, c1, h1] = oklchOf(from)
  const [l2, c2, h2] = oklchOf(to)
  const a = c1 * Math.cos(h1) * (1 - t) + c2 * Math.cos(h2) * t
  const b = c1 * Math.sin(h1) * (1 - t) + c2 * Math.sin(h2) * t
  return hexOf([l1 + (l2 - l1) * t, Math.hypot(a, b), Math.atan2(b, a)])
}

/** The accent, moved away from the ground only as far as it must be to
 *  read as text on it. */
function readable(accent: string, ground: string, light: boolean) {
  const [start, c, h] = oklchOf(accent)
  let l = start
  let hex = accent
  while (contrast(hex, ground) < 4.5) {
    l += light ? -0.01 : 0.01
    hex = hexOf([l, c, h])
  }
  return hex
}

/** A theme's tokens, in the shape of the stock themes' in styles.css. */
export function themeTokens({ base, accent, light }: NationalTheme) {
  const [, baseChroma, hue] = oklchOf(base)
  const tint = Math.min(baseChroma, light ? 0.01 : 0.04)
  const ground = (l: number, c = tint) => hexOf([l, c, hue])
  const lights = light
    ? [0.955, 0.99, 1, 0.955, 0.91, 0.78, 0.2, 0.36, 0.46, 0.86, 0.92]
    : [0.16, 0.19, 0.215, 0.25, 0.25, 0.37, 0.93, 0.83, 0.73, 0.3, 0.13]
  const [deep, bg, surface, surface2, subtle, strong] = lights
    .slice(0, 6)
    .map((l) => ground(l))
  const [text, text2, muted] = lights.slice(6, 9).map((l) => ground(l, 0.015))
  const brand = readable(accent, bg, !!light)
  const ink = contrast(brand, '#0c0e10') > contrast(brand, '#ffffff')
  const fieldBg = ground(lights[10])
  const edge = light ? '#000000' : '#ffffff'
  const shadow = light ? '0 0 0' : '1 0 0'
  return {
    'bg-deep': deep,
    bg,
    surface,
    'surface-2': surface2,
    'border-subtle': subtle,
    'border-strong': strong,
    text,
    'text-secondary': text2,
    'text-muted': muted,
    brand,
    'brand-soft': `${brand}1f`,
    'brand-ink': ink ? '#0c0e10' : '#ffffff',
    elevation: `0 0 0 1px oklch(${shadow} / 0.07)`,
    'elevation-hover': `0 0 0 1px oklch(${shadow} / 0.13)`,
    'img-outline': light ? 'rgb(0 0 0 / 0.1)' : 'rgb(255 255 255 / 0.1)',
    'scroll-thumb': light ? 'rgb(0 0 0 / 0.18)' : 'rgb(255 255 255 / 0.14)',
    selection: ground(lights[9]),
    'field-bg': fieldBg,
    'field-dim': mix(brand, fieldBg, 0.7),
    'field-mid': mix(brand, fieldBg, 0.38),
    'field-lit': brand,
    'field-hover': mix(brand, edge, 0.3),
    'field-crest': mix(brand, edge, 0.6),
    'hdr-text': text,
    'hdr-text-2': text2,
    'hdr-brand': brand,
    'hdr-ink': ink ? '#0c0e10' : '#ffffff',
    'hdr-surface': surface,
    'hdr-surface-2': surface2,
  }
}

/** A theme's CSS block, as the build hands it to its own site. */
export function themeCss(theme: NationalTheme) {
  const tokens = Object.entries(themeTokens(theme))
    .map(([name, value]) => `  --t-${name}: ${value};`)
    .join('\n')
  const scheme = theme.light ? 'light' : 'dark'
  return `[data-theme='${theme.id}'] {\n${tokens}\n  color-scheme: ${scheme};\n}\n`
}
