/**
 * A theme for every country with a site of its own, drawn from its flag.
 *
 * Each flag colour gets a job, the way the flag itself uses it:
 *
 * - `base` is the field: the page's ground is a deep, near black shade of
 *   it, and the background pixels rest in it.
 * - `button` is the colour that stands out against the field: the main
 *   buttons are filled with it, exactly, with a label in another flag
 *   colour where one is readable.
 * - `links` and `hot` (the pixels the cursor and a click light up) take
 *   the button's colour unless a flag says otherwise.
 * - `word` lays the flag on the wordmark. Striped flags show their
 *   stripes. Flags that are a field with an emblem (Türkiye's crescent,
 *   Japan's disc) wear the emblem's colour, over a ground in the field's.
 *   A Nordic cross shows its horizontal arm, and its upright runs down the
 *   M's middle stem, which rises above the word and gives the cross its
 *   top, a solid bar left of centre that never falls into a gap between
 *   letters. The cross is one colour: a flag's thin white edging would be
 *   single pixels here. A flag with a hoist or
 *   a canton (the UAE's red bar, the Stars and Stripes' blue) lays it over
 *   the bands from the left, ending in a gap between letters.
 *
 * `scripts/build-national-themes.mjs` turns this into the tokens in
 * src/national-themes.css. Flag colours are used exactly wherever they
 * sit on something they contrast with. Only a colour that would vanish
 * on the dark ground (a deep navy stripe, say) is lifted, and only as far
 * as it takes to be seen.
 */

export type NationalTheme = {
  /** The country the language's site stands for, as an ISO code. */
  country: string
  id: string
  /** The country's name in its own language. */
  name: string
  /** Dark, or light where the flag's own field is white. */
  ground: 'dark' | 'light'
  /** The flag's own colours, by name, at their official values. */
  colors: Record<string, string>
  /** The field: the ground leans toward it and the pixels rest in it. */
  base: string
  /** The main buttons' fill, and the flag colours to try for their label,
   *  in order. Where none is readable, the label is the page's own ink. */
  button: { fill: string; label?: string[] }
  /** Links and focus rings, where not the button's colour. */
  links?: string
  /** The pixels the cursor and clicks light up, where not the button's. */
  hot?: string
  /** The wordmark: bands from the top over its 19 rows, or stripes from
   *  the left over its 81 columns, each a flag colour and a size. */
  word:
    | {
        bands: [color: string, rows: number][]
        /** A block over the bands from the top left: the O alone is 11
         *  columns, OM is 27. Its height is all 19 rows unless given. */
        hoist?: [color: string, columns: 11 | 27, rows?: number]
        /** Bars down the whole word, each from one column up to another,
         *  the later ones on top: a Nordic cross's upright. The M's middle
         *  stem is columns 17 to 20. */
        uprights?: [color: string, from: number, to: number][]
      }
    | { stripes: [color: string, columns: number][] }
}

export const NATIONAL_THEMES: NationalTheme[] = [
  {
    country: 'AD',
    id: 'andorra',
    name: 'Andorra',
    ground: 'dark',
    colors: { blue: '#10069F', yellow: '#FEDF00', red: '#D0103A' },
    base: 'blue',
    button: { fill: 'yellow', label: ['blue'] },
    word: {
      stripes: [
        ['blue', 26],
        ['yellow', 29],
        ['red', 26],
      ],
    },
  },
  {
    country: 'AE',
    id: 'emirates',
    name: 'الإمارات',
    ground: 'dark',
    colors: {
      red: '#FF0000',
      green: '#00732F',
      white: '#FFFFFF',
      black: '#000000',
    },
    base: 'green',
    button: { fill: 'red', label: ['white', 'black'] },
    word: {
      bands: [
        ['green', 6],
        ['white', 7],
        ['black', 6],
      ],
      hoist: ['red', 11],
    },
  },
  {
    country: 'AU',
    id: 'australia',
    name: 'Australia',
    ground: 'dark',
    colors: { blue: '#00008B', red: '#E4002B', white: '#FFFFFF' },
    base: 'blue',
    button: { fill: 'red', label: ['white'] },
    hot: 'white',
    word: { bands: [['white', 19]] },
  },
  {
    country: 'BA',
    id: 'bosna',
    name: 'Bosna i Hercegovina',
    ground: 'dark',
    colors: { blue: '#002395', yellow: '#FECB00', white: '#FFFFFF' },
    base: 'blue',
    button: { fill: 'yellow', label: ['blue'] },
    hot: 'white',
    word: { bands: [['yellow', 19]] },
  },
  {
    country: 'BD',
    id: 'bangladesh',
    name: 'বাংলাদেশ',
    ground: 'dark',
    colors: { green: '#006A4E', red: '#F42A41' },
    base: 'green',
    button: { fill: 'red', label: ['green'] },
    word: { bands: [['red', 19]] },
  },
  {
    country: 'CN',
    id: 'zhongguo',
    name: '中国',
    ground: 'dark',
    colors: { red: '#DE2910', yellow: '#FFDE00' },
    base: 'red',
    button: { fill: 'yellow', label: ['red'] },
    word: { bands: [['yellow', 19]] },
  },
  {
    country: 'DK',
    id: 'danmark',
    name: 'Danmark',
    ground: 'dark',
    colors: { red: '#C8102E', white: '#FFFFFF' },
    base: 'red',
    button: { fill: 'red', label: ['white'] },
    hot: 'white',
    word: {
      bands: [
        ['red', 8],
        ['white', 3],
        ['red', 8],
      ],
      uprights: [['white', 17, 20]],
    },
  },
  {
    country: 'FI',
    id: 'suomi',
    name: 'Suomi',
    ground: 'light',
    colors: { blue: '#002F6C', white: '#FFFFFF' },
    base: 'blue',
    button: { fill: 'blue', label: ['white'] },
    word: { bands: [['blue', 19]] },
  },
  {
    country: 'FR',
    id: 'france',
    name: 'France',
    ground: 'dark',
    colors: { blue: '#000091', white: '#FFFFFF', red: '#E1000F' },
    base: 'blue',
    button: { fill: 'red', label: ['white'] },
    word: {
      stripes: [
        ['blue', 27],
        ['white', 27],
        ['red', 27],
      ],
    },
  },
  {
    country: 'GR',
    id: 'hellas',
    name: 'Ελλάδα',
    ground: 'dark',
    colors: { blue: '#0D5EAF', white: '#FFFFFF' },
    base: 'blue',
    button: { fill: 'white', label: ['blue'] },
    links: 'blue',
    word: {
      // The letters span rows 1 to 16, so the outer blue stripes take a row
      // more and the middle one a row less: the letters begin and end blue.
      bands: [
        ['blue', 3],
        ['white', 2],
        ['blue', 2],
        ['white', 2],
        ['blue', 1],
        ['white', 2],
        ['blue', 2],
        ['white', 2],
        ['blue', 3],
      ],
    },
  },
  {
    country: 'HU',
    id: 'magyarorszag',
    name: 'Magyarország',
    ground: 'dark',
    colors: { red: '#CD2A3E', white: '#FFFFFF', green: '#436F4D' },
    base: 'green',
    button: { fill: 'red', label: ['white'] },
    word: {
      bands: [
        ['red', 6],
        ['white', 7],
        ['green', 6],
      ],
    },
  },
  {
    country: 'IE',
    id: 'eire',
    name: 'Éire',
    ground: 'dark',
    colors: { green: '#169B62', white: '#FFFFFF', orange: '#FF883E' },
    base: 'green',
    button: { fill: 'orange', label: ['white'] },
    word: {
      stripes: [
        ['green', 27],
        ['white', 27],
        ['orange', 27],
      ],
    },
  },
  {
    country: 'IN',
    id: 'bharat',
    name: 'भारत',
    ground: 'dark',
    colors: {
      saffron: '#FF9933',
      white: '#FFFFFF',
      green: '#138808',
      navy: '#000080',
    },
    base: 'green',
    button: { fill: 'saffron', label: ['navy'] },
    word: {
      bands: [
        ['saffron', 6],
        ['white', 7],
        ['green', 6],
      ],
    },
  },
  {
    country: 'IS',
    id: 'island',
    name: 'Ísland',
    ground: 'dark',
    colors: { blue: '#02529C', white: '#FFFFFF', red: '#DC1E35' },
    base: 'blue',
    button: { fill: 'red', label: ['white'] },
    word: {
      bands: [
        ['blue', 8],
        ['red', 3],
        ['blue', 8],
      ],
      uprights: [['red', 17, 20]],
    },
  },
  {
    country: 'IT',
    id: 'italia',
    name: 'Italia',
    ground: 'dark',
    colors: { green: '#009246', white: '#F4F5F0', red: '#CE2B37' },
    base: 'green',
    button: { fill: 'red', label: ['white'] },
    word: {
      stripes: [
        ['green', 27],
        ['white', 27],
        ['red', 27],
      ],
    },
  },
  {
    country: 'JP',
    id: 'nippon',
    name: '日本',
    ground: 'light',
    colors: { red: '#BC002D', white: '#FFFFFF' },
    base: 'red',
    button: { fill: 'red', label: ['white'] },
    word: { bands: [['red', 19]] },
  },
  {
    country: 'KR',
    id: 'hanguk',
    name: '대한민국',
    ground: 'light',
    colors: {
      red: '#CD2E3A',
      blue: '#0047A0',
      black: '#000000',
      white: '#FFFFFF',
    },
    base: 'blue',
    button: { fill: 'red', label: ['white'] },
    links: 'blue',
    word: {
      bands: [
        ['red', 10],
        ['blue', 9],
      ],
    },
  },
  {
    country: 'LK',
    id: 'srilanka',
    name: 'Sri Lanka',
    ground: 'dark',
    colors: {
      maroon: '#8D153A',
      gold: '#FFBE29',
      saffron: '#EB7400',
      green: '#00534E',
    },
    base: 'maroon',
    button: { fill: 'gold', label: ['maroon'] },
    word: { bands: [['gold', 19]] },
  },
  {
    country: 'LT',
    id: 'lietuva',
    name: 'Lietuva',
    ground: 'dark',
    colors: { yellow: '#FDB913', green: '#006A44', red: '#C1272D' },
    base: 'green',
    button: { fill: 'yellow', label: ['green'] },
    word: {
      bands: [
        ['yellow', 6],
        ['green', 7],
        ['red', 6],
      ],
    },
  },
  {
    country: 'MX',
    id: 'mexico',
    name: 'México',
    ground: 'dark',
    colors: { green: '#006847', white: '#FFFFFF', red: '#CE1126' },
    base: 'green',
    button: { fill: 'red', label: ['white'] },
    word: {
      stripes: [
        ['green', 27],
        ['white', 27],
        ['red', 27],
      ],
    },
  },
  {
    country: 'NG',
    id: 'nigeria',
    name: 'Nigeria',
    ground: 'dark',
    colors: { green: '#008751', white: '#FFFFFF' },
    base: 'green',
    button: { fill: 'white', label: ['green'] },
    links: 'green',
    word: {
      stripes: [
        ['green', 27],
        ['white', 27],
        ['green', 27],
      ],
    },
  },
  {
    country: 'NL',
    id: 'nederland',
    name: 'Nederland',
    ground: 'dark',
    colors: { red: '#AE1C28', white: '#FFFFFF', blue: '#21468B' },
    base: 'blue',
    button: { fill: 'red', label: ['white'] },
    word: {
      bands: [
        ['red', 6],
        ['white', 7],
        ['blue', 6],
      ],
    },
  },
  {
    country: 'NO',
    id: 'norge',
    name: 'Norge',
    ground: 'dark',
    colors: { red: '#BA0C2F', white: '#FFFFFF', blue: '#00205B' },
    base: 'red',
    button: { fill: 'red', label: ['white'] },
    hot: 'white',
    word: {
      bands: [
        ['red', 8],
        ['blue', 3],
        ['red', 8],
      ],
      uprights: [['blue', 17, 20]],
    },
  },
  {
    country: 'NZ',
    id: 'new-zealand',
    name: 'New Zealand',
    ground: 'dark',
    colors: { blue: '#00247D', red: '#CC142B', white: '#FFFFFF' },
    base: 'blue',
    button: { fill: 'red', label: ['white'] },
    word: { bands: [['red', 19]] },
  },
  {
    country: 'PH',
    id: 'pilipinas',
    name: 'Pilipinas',
    ground: 'dark',
    colors: {
      blue: '#0038A8',
      red: '#CE1126',
      white: '#FFFFFF',
      yellow: '#FCD116',
    },
    base: 'blue',
    button: { fill: 'yellow', label: ['blue'] },
    word: {
      bands: [
        ['blue', 10],
        ['red', 9],
      ],
      hoist: ['white', 11],
    },
  },
  {
    country: 'PK',
    id: 'pakistan',
    name: 'پاکستان',
    ground: 'dark',
    colors: { green: '#01411C', white: '#FFFFFF' },
    base: 'green',
    button: { fill: 'white', label: ['green'] },
    word: { bands: [['white', 19]] },
  },
  {
    country: 'PL',
    id: 'polska',
    name: 'Polska',
    ground: 'dark',
    colors: { white: '#FFFFFF', red: '#DC143C' },
    base: 'red',
    button: { fill: 'red', label: ['white'] },
    hot: 'white',
    word: {
      bands: [
        ['white', 10],
        ['red', 9],
      ],
    },
  },
  {
    country: 'PT',
    id: 'portugal',
    name: 'Portugal',
    ground: 'dark',
    colors: { green: '#046A38', red: '#DA291C', yellow: '#FFE900' },
    base: 'green',
    button: { fill: 'red' },
    links: 'yellow',
    hot: 'yellow',
    word: {
      stripes: [
        ['green', 32],
        ['red', 49],
      ],
    },
  },
  {
    country: 'SE',
    id: 'sverige',
    name: 'Sverige',
    ground: 'dark',
    colors: { blue: '#006AA7', yellow: '#FECC02' },
    base: 'blue',
    button: { fill: 'yellow', label: ['blue'] },
    word: {
      bands: [
        ['blue', 8],
        ['yellow', 3],
        ['blue', 8],
      ],
      uprights: [['yellow', 17, 20]],
    },
  },
  {
    country: 'SG',
    id: 'singapore',
    name: 'Singapore',
    ground: 'dark',
    colors: { red: '#EF3340', white: '#FFFFFF' },
    base: 'red',
    button: { fill: 'white', label: ['red'] },
    links: 'red',
    word: {
      bands: [
        ['red', 10],
        ['white', 9],
      ],
    },
  },
  {
    country: 'TH',
    id: 'thai',
    name: 'ไทย',
    ground: 'dark',
    colors: { red: '#A51931', white: '#F4F5F8', blue: '#2D2A4A' },
    base: 'blue',
    button: { fill: 'red', label: ['white'] },
    word: {
      bands: [
        ['red', 3],
        ['white', 3],
        ['blue', 7],
        ['white', 3],
        ['red', 3],
      ],
    },
  },
  {
    country: 'TR',
    id: 'turkiye',
    name: 'Türkiye',
    ground: 'dark',
    colors: { red: '#E30A17', white: '#FFFFFF' },
    base: 'red',
    button: { fill: 'red', label: ['white'] },
    hot: 'white',
    word: { bands: [['white', 19]] },
  },
  {
    country: 'US',
    id: 'usa',
    name: 'United States',
    ground: 'dark',
    colors: { red: '#B31942', white: '#FFFFFF', blue: '#0A3161' },
    base: 'blue',
    button: { fill: 'red', label: ['white'] },
    hot: 'white',
    word: {
      bands: [
        ['red', 3],
        ['white', 2],
        ['red', 3],
        ['white', 3],
        ['red', 3],
        ['white', 2],
        ['red', 3],
      ],
      hoist: ['blue', 27, 11],
    },
  },
  {
    country: 'UZ',
    id: 'ozbekiston',
    name: 'Oʻzbekiston',
    ground: 'dark',
    colors: {
      blue: '#0099B5',
      white: '#FFFFFF',
      green: '#1EB53A',
      red: '#CE1126',
    },
    base: 'blue',
    button: { fill: 'green', label: ['white'] },
    word: {
      bands: [
        ['blue', 6],
        ['red', 1],
        ['white', 5],
        ['red', 1],
        ['green', 6],
      ],
    },
  },
  {
    country: 'VN',
    id: 'vietnam',
    name: 'Việt Nam',
    ground: 'dark',
    colors: { red: '#DA251D', yellow: '#FFFF00' },
    base: 'red',
    button: { fill: 'yellow', label: ['red'] },
    word: { bands: [['yellow', 19]] },
  },
  {
    country: 'ZW',
    id: 'zimbabwe',
    name: 'Zimbabwe',
    ground: 'dark',
    colors: {
      green: '#319208',
      yellow: '#FFD200',
      red: '#DE2010',
      black: '#000000',
      white: '#FFFFFF',
    },
    base: 'green',
    button: { fill: 'yellow', label: ['black'] },
    word: {
      bands: [
        ['green', 3],
        ['yellow', 3],
        ['red', 2],
        ['black', 3],
        ['red', 2],
        ['yellow', 3],
        ['green', 3],
      ],
      hoist: ['white', 11],
    },
  },
]
