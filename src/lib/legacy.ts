/**
 * The site, restyled for browsers too old for its stylesheet.
 *
 * Tailwind 4 puts nearly every rule in cascade layers and colours them with
 * color-mix(). A browser without those (Safari before 16.2, as on Macs stuck
 * on older macOS) drops the layers and keeps the rest, so icons and canvases
 * render unsized across the whole screen and the page cannot be read. Text
 * browsers have no such trouble: they read the HTML as it is.
 *
 * This gives the old ones the same page in a simpler dress. It turns every
 * page stylesheet off and puts one small sheet in their place, written only
 * with CSS those browsers know: the default Tokyo Night palette, the mono
 * face, the bar with its wordmark, green buttons, the install cards, and
 * sections on alternating grounds. What only works styled or scripted
 * (inline SVG, canvases, video, aria-hidden decoration, and buttons, which
 * need the scripts these browsers cannot run) is hidden. The HTML, its links
 * and its downloads stay exactly as every other browser gets them.
 *
 * ?legacy forces it in any browser, to see what those visitors see. Modern
 * browsers that are not forced return on the first line and get the site
 * exactly as before. The script is ES5 so the browsers it is for can run it, and it goes first in
 * <head>, before the stylesheets, so the page is hidden until they are off.
 */
const BG = '#1a1b26'
const BG_DEEP = '#13141c'
const FIELD = '#0e0e14'
const SURFACE = '#1f2230'
const SURFACE_2 = '#24283b'
const BORDER = '#414868'
const TEXT = '#c0caf5'
const TEXT_2 = '#a9b1d6'
const MUTED = '#8b93b8'
const BRAND = '#9ece6a'
const BRAND_DIM = '#678549'
const INK = '#0c0e10'

function sheet(monoFont: string) {
  return [
    'html.legacy-pending body{visibility:hidden}',
    `@font-face{font-family:"JetBrains Mono Variable";font-style:normal;font-weight:100 800;font-display:swap;src:url(${monoFont}) format("woff2")}`,
    '*{box-sizing:border-box}',
    `html{background:${BG}}`,
    `body{margin:0;background:${BG};color:${TEXT};font:15px/1.65 "JetBrains Mono Variable",Menlo,Consolas,monospace;-webkit-font-smoothing:antialiased}`,
    `a{color:${BRAND};text-decoration:underline}`,
    `p{color:${TEXT_2}}`,
    `h1,h2,h3,h4{color:${TEXT};line-height:1.3;font-weight:600}`,
    'h1 a,h2 a,h3 a,h4 a{color:inherit;text-decoration:none}',
    'svg,canvas,video,audio,iframe,template,dialog,button,[hidden],[aria-hidden="true"]{display:none}',
    'img{max-width:100%;height:auto}',
    // Text meant for screen readers only stays out of sight, but readable.
    '.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}',
    // A heading whose visible text is a scripted animation (aria-hidden) keeps
    // the real words in its screen-reader copy, which shows here instead.
    '[data-typed-block] .sr-only{position:static;width:auto;height:auto;overflow:visible;clip:auto;white-space:normal}',
    `pre,code{font-family:inherit;white-space:pre-wrap;word-wrap:break-word;color:${TEXT}}`,
    `pre{background:${SURFACE};border:1px solid ${SURFACE_2};padding:12px 16px}`,
    `blockquote{margin:24px 0;padding-left:16px;border-left:2px solid ${BRAND}}`,
    // The skip link stays reachable for keyboards, out of sight otherwise.
    'a[href="#main"]{position:absolute;left:-9999px}',
    'a[href="#main"]:focus{left:16px;top:8px;z-index:9}',
    // The bar: the wordmark, the links, the Install button.
    `header.sticky{background:${FIELD};border-bottom:1px solid ${SURFACE_2}}`,
    'header.sticky>div>div{max-width:72rem;margin:0 auto;padding:0 24px;min-height:56px;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;-webkit-flex-wrap:wrap;flex-wrap:wrap}',
    'header.sticky a[href="/"]{display:inline-block;width:112px;height:26px;margin-right:16px;background:url(/brand/omarchy-wordmark.svg) no-repeat left center;background-size:contain}',
    `header.sticky nav a{color:${TEXT_2};text-decoration:none;padding:6px 12px;font-size:14px}`,
    `header.sticky nav a:hover{color:${TEXT}}`,
    // Icon-only links need their glyphs, which are hidden; the logo keeps
    // its label and gets the wordmark as a background instead.
    'header.sticky a[aria-label]:not([href="/"]){display:none}',
    'header.sticky>div>div>div{margin-left:auto}',
    // Buttons: brand green, the second in a row on the dark surface.
    `a[data-slot="button"]{display:inline-block;padding:8px 18px;margin:4px 8px 4px 0;background:${BRAND};color:${INK};font-weight:600;text-decoration:none;border:1px solid ${BRAND}}`,
    `a[data-slot="button"]+a[data-slot="button"]{background:${SURFACE_2};color:${TEXT};border-color:${BORDER}}`,
    // Sections: a centred column on alternating grounds, the hero on the field.
    // Inner pages (manual, news, teams...): one centred column.
    '#main main:not(.home){display:block;max-width:72rem;margin:0 auto;padding:32px 24px 64px}',
    // The manual's sidebar is a scripted scroll area; the collapsible
    // chapter list it also has for narrow screens works everywhere.
    'nav[data-manual-toc]{display:none}',
    `details{border:1px solid ${SURFACE_2};padding:8px 16px;margin:0 0 24px}`,
    `summary{cursor:pointer;color:${TEXT_2};font-size:13px}`,
    'details ol li{display:block;margin:4px 0}',
    // Page wordmarks are masked blocks sized by classes and aspect-ratio,
    // which these browsers lack: give them a fixed size and the brand green.
    `div[role="img"][style*="omarchy-wordmark"]{width:280px;max-width:70%;height:64px;margin:16px auto 8px;color:${BRAND};background-image:none!important}`,
    `.page-subtitle{text-align:center;color:${MUTED};font-size:12px;letter-spacing:.18em;text-transform:uppercase}`,
    `main.home>section{background:${BG}}`,
    `main.home>section:nth-of-type(odd){background:${BG_DEEP}}`,
    'main.home>section>div{max-width:72rem;margin:0 auto;padding:48px 24px}',
    `main.home>section:first-of-type{background:${FIELD};text-align:center;padding:72px 24px 96px}`,
    'main.home>section:first-of-type>div{padding:0}',
    'main.home>section:first-of-type h1{font-size:30px;margin:32px 0 16px}',
    `main.home>section:first-of-type a[href*="/news/"]{display:inline-block;padding:4px 14px;border:1px solid ${BRAND_DIM};color:${BRAND};text-decoration:none;font-size:13px}`,
    'main.home>section:first-of-type p span{display:block}',
    // The hero's pixel wordmark is drawn on a canvas; the SVG stands in.
    'main.home>section:first-of-type h1:before{content:"";display:block;max-width:100%;height:130px;margin:40px auto 48px;background:url(/brand/omarchy-wordmark.svg) no-repeat center;background-size:contain}',
    'main.home>section:first-of-type a[data-slot="button"]{margin:24px 6px 0}',
    // The video rail: its slides are play buttons, shown here as their
    // thumbnails and titles.
    '[aria-roledescription="slide"]{display:inline-block;vertical-align:top;width:32%;margin-right:1%}',
    '@media (max-width:900px){[aria-roledescription="slide"]{display:block;width:auto;margin-right:0}}',
    '[aria-roledescription="slide"] button{display:block;width:100%;margin:0 0 24px;padding:0;background:none;border:0;text-align:left;font:inherit;color:inherit}',
    '[aria-roledescription="slide"] button span{display:block}',
    `[aria-roledescription="slide"] button span span+span{color:${MUTED};font-size:13px}`,
    'article img{max-height:420px;width:auto}',
    // Cards: the install options side by side where there is room.
    `article{background:${SURFACE};border:1px solid ${SURFACE_2};padding:20px;margin:0 0 16px}`,
    '#install article{display:inline-block;vertical-align:top;width:32%;margin-right:1%}',
    '#install article h4{display:inline;font-size:16px;margin:0}',
    `#install article h4+p{display:inline;margin-left:8px;font-size:12px;color:${MUTED}}`,
    '#install article p{font-size:13px}',
    '#install article a[data-slot="button"]{display:block;text-align:center;margin:12px 0 8px}',
    `#install article a[href$=".sig"]{font-size:12px;color:${MUTED}}`,
    '@media (max-width:900px){#install article{display:block;width:auto;margin-right:0}}',
    // Plugin cards: three to a row, a fixed-height cover, compact text.
    '#plugins .rail-bare>div{display:inline-block;vertical-align:top;width:32%;margin-right:1%}',
    '#plugins article{padding:0;overflow:hidden}',
    `#plugins article>div:first-child{height:180px;overflow:hidden;background:${BG_DEEP}}`,
    '#plugins article>div:first-child img{width:100%;height:100%;max-height:none;object-fit:cover}',
    '#plugins article>div+div{padding:14px 16px}',
    '#plugins article h3{display:inline;font-size:14px;margin:0}',
    `#plugins article h3+span{float:right;font-size:12px;color:${MUTED}}`,
    '#plugins article h3+span:before{content:"\\2605  "}',
    '#plugins article p{font-size:13px;margin:8px 0 0}',
    `#plugins article p+p{font-size:12px;color:${MUTED}}`,
    '@media (max-width:900px){#plugins .rail-bare>div{display:block;width:auto;margin-right:0}}',
    `figure{margin:0 0 16px}figcaption{color:${MUTED};font-size:13px;margin-top:6px}`,
    // Lists outside prose are galleries and link rows on the site: logos,
    // faces, themes, meetups, footer links. They flow inline without
    // bullets, so an item whose only content is hidden (an inline icon, a
    // scripted picker) collapses instead of leaving a lone bullet. Prose
    // (manual, news, pages) keeps ordinary bulleted lists.
    `ul,ol{color:${TEXT_2};list-style:none;margin:16px 0;padding:0}`,
    'li{display:inline-block;vertical-align:top;margin:0 12px 10px 0}',
    '.prose ul{list-style:disc;padding-left:1.5em}.prose ol{list-style:decimal;padding-left:1.5em}',
    '.prose li{display:list-item;margin:0 0 6px}',
    // Link cards (news, meetups): date, title and summary on lines of their own.
    `li>a>time,li>a>span,li>a>p{display:block;color:${TEXT_2}}`,
    `li>a>time{color:${MUTED};font-size:12px;margin-top:8px}`,
    `li>a>span:first-of-type{color:${TEXT}}`,
    'li[data-slide]{width:23%}',
    '@media (max-width:900px){li[data-slide]{width:46%}}',
    // Team and patron clusters: the name above a row of round faces.
    '.team-cluster{display:block;margin:0 0 24px}',
    `.team-cluster>button{display:block;margin:0 0 8px;padding:0;background:none;border:0;text-align:left;font:inherit;color:${TEXT}}`,
    `.team-cluster>button span{display:block}.team-cluster>button span+span{color:${MUTED};font-size:12px}`,
    '.team-faces{margin:0}.team-face{margin:0 6px 6px 0}',
    `.team-face a{display:block;width:48px;height:48px;line-height:48px;text-align:center;font-size:12px;border-radius:50%;overflow:hidden;background:${SURFACE_2};color:${TEXT_2};text-decoration:none}`,
    '.team-face img{display:block;width:48px;height:48px;border-radius:50%}',
    `hr{border:0;border-top:1px solid ${SURFACE_2}}`,
    // The footer, on the deep ground.
    `footer{background:${BG_DEEP};border-top:1px solid ${SURFACE_2};color:${MUTED};font-size:13px}`,
    'footer>div{max-width:72rem;margin:0 auto;padding:40px 24px}',
    `footer a{display:inline-block;color:${TEXT_2};text-decoration:none;margin:0 16px 6px 0}`,
    'div>a+a{margin-left:.75em}',
    // Headers and articles inside pages are plain, not the bar or a card.
    '#main header{background:none;border:0}',
    'main:not(.home)>article,.manual-chapter article{background:none;border:0;padding:0}',
    // Tailwind's block utility, which the markup leans on to break lines.
    '.block{display:block}',
  ].join('')
}

/**
 * The inline script that switches an old browser to the sheet above. It
 * reruns after every client-side navigation (data-astro-rerun on its tag):
 * the router swaps in the next page's <head>, which drops this sheet and
 * brings the page stylesheets back, so each run puts the sheet back and
 * turns the others off again. ?legacy keeps the forced mode for the rest of
 * the tab's session, so reviewers can click around; ?legacy=0 ends it.
 */
export function legacyInitScript(monoFont: string) {
  return `(function(){try{var ss=null;try{ss=window.sessionStorage}catch(e){}var f=/[?&]legacy(?:=([^&]*))?(?:&|$)/.exec(location.search);if(f&&ss){if(f[1]==='0')ss.removeItem('omarchy-legacy');else ss.setItem('omarchy-legacy','1')}var forced=(f&&f[1]!=='0')||(ss&&ss.getItem('omarchy-legacy')==='1'),c=window.CSS;if(!forced&&c&&c.supports&&c.supports('color','color-mix(in srgb,red,blue)')&&'CSSLayerBlockRule' in window)return;var d=document,h=d.documentElement,s=d.getElementById('legacy-css');if(!s){s=d.createElement('style');s.id='legacy-css';s.appendChild(d.createTextNode(${JSON.stringify(sheet(monoFont))}));d.head.appendChild(s)}if(!/(^|\\s)legacy(\\s|$)/.test(h.className))h.className+=' legacy';var off=function(){for(var i=0;i<d.styleSheets.length;i++){var x=d.styleSheets[i];if(x.ownerNode!==s)x.disabled=true}},show=function(){off();h.className=h.className.replace(/(^|\\s)legacy-pending(?=\\s|$)/g,'')};off();if(d.readyState==='loading'){h.className+=' legacy-pending';d.addEventListener('DOMContentLoaded',show);setTimeout(show,3000)}window.addEventListener('load',off)}catch(e){}})()`
}
