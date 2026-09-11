# Omarchy

Beautiful, Fun & Agentic Linux by DHH.

See https://github.com/omacom/omarchy for more.

## Working on the site

Use Node 24 or newer and Python 3.13. Run `npm ci`, then `npm run dev` (or `bin/serve`) to preview the Astro site.
`npm run build` produces the static site in `dist/client`; `npm run parity`
checks its page URLs and verifies that passthrough files are unchanged.
Run `npm run lint`, `npm run typecheck`, and `npm test` before pushing.
Pull requests run those checks, a build, and parity in GitHub Actions;
merging to `master` deploys the checked output to GitHub Pages.

Cloudflare Workers previews use the same static output. `wrangler.jsonc`
runs `npm run build` before uploading `dist/client`, including the installers
and legacy assets. In Workers Builds, use the repository root, leave the
separate build command empty, and keep `npx wrangler versions upload` as the
non-production deploy command. The configured Worker name is `omarchy`.
Wrangler is pinned in the lockfile; it does not need an Astro server adapter.
Run `npx wrangler deploy --dry-run` to check the build and configuration
without uploading or deploying.

Development serves the same installers, downloads, legacy pages, and redirects
as the assembled site. Page components have separate browser entries so a
manual or news visit does not load the homepage's interactive showcases.

The HTML under the standalone page directories, `themes/`, `manual/`, and
dated `news/` directories is **content input**, not a second site design.
`scripts/port_content.py` extracts it into `src/data` on every build. Keep
layout, navigation, and styling in `src/`; preview through the dev server.
After editing content inputs, run `npm run port` to refresh the dev data.

- Edit standalone page content in its existing `index.html`. Page directories are discovered automatically; there is no route or translation allowlist.
- Add standalone pages as `content/<path>.md` with YAML frontmatter (`title`, optional `seoTitle` and `description`), then run `npm run port`. All pages are automatically routed and their metadata and prose enter the shared translation pipeline. News under `content/news/` uses its existing separate pipeline. Set `presentation: principles` for compact linked headings, as in `content/doctrine.md`.
- Edit the homepage announcement in `src/data/banner.json` (`null` hides it).
- Run `bin/build-news` after editing Markdown in `content/news/`; it updates
  article inputs, images, and the RSS feed.
- Run `bin/build-manual [path/to/omarchy/manual]` to refresh manual inputs and
  images. The Astro site builds its table of contents and search index.

Social cards use the site's theme palettes and existing translations: 31 languages
in all 22 themes. `npm run build:social` regenerates every 1200×630 PNG under
`public/brand/social/`; normal builds regenerate only the active language.
Each page selects a stable theme from its canonical path, and its locale selects
the translated card. English cards stay at the directory root; other languages
use a locale subdirectory. After changing palettes, themes, or card copy,
regenerate and commit the images. Bundled font subsets support all scripts;
see [font maintenance](scripts/fonts/social/README.md) when adding characters.
Social platforms may retain cached previews for already-shared links.

The screensaver and the Discord redirect are still served
directly. Their styles, fonts, and scripts remain under `assets/`, alongside
shared images and public downloads.

## Adding your theme

Community themes are listed on [omarchy.org/themes](https://omarchy.org/themes/).
To get yours on the page, open a pull request with two things.

**1. A screenshot.** Take a 16:9 shot of the theme on a real desktop, then
convert it:

    magick preview.png -strip -resize '1200>' -quality 80 your-theme.webp

Put the result in `assets/themes/`. Name the file after the theme, lowercase
and hyphenated — `your-theme.webp`. Aim for 1200x675; keep it under about
100KB so the page stays quick to load.

**2. An entry.** Add a figure block to `themes/index.html`, in alphabetical
order among the others:

```html
<figure class="themes__theme">
  <a href="https://github.com/you/your-theme"
    ><img
      src="/assets/themes/your-theme.webp"
      alt="Your Theme theme"
      loading="lazy"
      decoding="async"
  /></a>
  <figcaption>
    <a href="https://github.com/you/your-theme">Your Theme</a>
  </figcaption>
</figure>
```

Both links point at the theme's own repository, which is where people
install it from and where it needs to keep living.

### The screenshot matters

The page is a grid of screenshots — that image is the whole pitch for your
theme, so give it the same care you gave the palette. Show a real session
with a terminal and an editor in it, not an empty desktop. Use the theme's own
wallpaper. Don't scale a small capture up, and don't include a cursor, a
notification, or anything personal you'd rather not publish.

Pull requests without a screenshot can't be merged, because there's nothing
to put on the page.

## Plugins

Plugins aren't in this repository. They're listed on
[plugins.omarchy.org](https://plugins.omarchy.org/) from the
[marketplace repo](https://github.com/omacom/omarchy-plugin-marketplace),
which has its own submission guide.

## Translations

The site uses shared components with separate language catalogues and domain builds.
English changes publish immediately. GitHub Actions fills in missing main-site copy and news translations with Muse afterward, then deploys the language sites. Existing human translations are preserved. See [the translation guide](docs/translations.md) for queues, local previews, and adding a language or domain.
