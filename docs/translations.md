# Translations

One site, shared components, separate static builds. English remains the source of truth. Each of the 100 languages has one primary address, either a registered domain or a language subdomain under omarchy.org. English uses omarchy.org. Manual links currently lead to the canonical English manual.

## Build and preview

```sh
npm run build                 # English → dist/client
npm run build:locale -- da    # Danish → dist/da
npm run dev:da               # Danish preview on port 3114
npm run check:translations   # Validate UI/prose and completed translations
```

Each output contains its own domain, CNAME, canonical URLs, language metadata, language links, and news RSS feed. It can be uploaded to any static host. The existing English deployment stays unchanged. Domain registration/DNS and hosting for omarchy.dk must be configured separately; building does not publish anything.

## Add another language

1. Register its language code, native name (`name`), English name (`englishName`), ISO 15924 script code (`script`: `Latn`, `Cyrl`, `Arab`, `Deva`, `Hans`…), domain, date/number formatting locale, Open Graph locale, and manual availability in `src/i18n/locales.json`. Use a unique domain. Keep `manual: false` until its manual is translated. A right-to-left script (`Arab`, `Hebr`, `Thaa`, `Nkoo`, `Syrc`) must declare `direction: "rtl"`; no other entry sets `direction`. An edition whose domain does not end in a two-letter country code needs an explicit `flag`. Optional `searchTerms` lists other spellings the language switcher should find it by (`["farsi"]`); the native name, English name, code and formatting locale are always searchable, ignoring accents and case. `npm run check:translations` validates every field, including that Node's `Intl` supports the formatting locale.
2. Add `src/i18n/messages/<code>.json`. English strings are keys; translations are values. Product names, commands, keyboard shortcuts, URLs, and menu paths shown in the actual Omarchy interface remain unchanged. Start with an empty JSON object and use `npm run site:translate` to populate it from current English sources; review the result.
3. Add `src/i18n/<code>/blocks.json` for authored HTML prose on the imported main pages. Keys are the original HTML inside prose blocks. Preserve links, IDs, classes, images, and code. This avoids duplicating live patron and team lists.
4. Add `src/i18n/<code>/news.json` with each article's translated title and `sourceHash`, plus the full article HTML in `news/<original-slug>.html`. Keep original slugs across languages so language switching lands on the same article. The source hash is SHA-256 of the English title, a newline, and the English HTML from `src/data/news-posts.json`.
5. Run `npm run port`, `npm run check:translations`, and `npm run build:locale -- <code>`. Review the rendered pages at desktop and mobile widths before configuring the domain.

Register a language before its translations are ready by adding `"draft": true` to its entry. A draft is fully translatable and buildable on its own: the pending queues, `translate-news.yml`'s translation matrix, strict checks, `npm run build:locale -- <code>`, `scripts/verify-locales.py <code>` and manual `npm run deploy:locale` all include it, and its own build lists itself in its switcher, footer and alternate links. Nothing else does: every published edition's switcher, footer, `hreflang` links, social-card set and deployment matrix skip drafts, so readers never reach an unfinished site. Drop the flag once `npm run check:translations -- --strict-site --strict-news <code>` passes and the domain is ready; the next workflow run deploys it and every other edition starts linking to it. In code, `publishedLocales` is the registry without drafts, `locales` and `sortedLocales` are what the current build links to (published, plus itself when it is a draft) and `allLocales` is the registry as written.

The registry also controls the globe switcher beside the theme button, the footer language switch and search-engine alternate links. Translation builds include redirects from manual URLs to the English domain, preserving the chapter path. Once manual translation is implemented, the registry flag can be enabled for that language.

## Updating copy

Use `t('English source copy')` for shared interface text. Push English edits normally; UI copy, imported prose, and news translations are filled in after English deploys. Missing or outdated translations use the current English title and body until the background workflow fills them in. Run `npm run news:pending` to see the queue, or `npm run check:translations -- --strict-news` to require complete, current news translations. Never update a source hash without translating or reviewing the new source.

Imported main-page prose uses exact English HTML keys. Changing the source creates a new translation task; old translations are never reused for changed copy. Missing UI/prose uses English while Muse catches up. Existing nonempty translations are preserved, including human-reviewed edits. The extractor in `scripts/translation-sources.mjs` reads literal `t()` calls and maintained adapters for dynamic copy such as team descriptions, page prose, SEO, banners, and featured plugin descriptions. New dynamic `t(variable)` sources need an extractor adapter and a test. Use `npm run site:pending` to inspect current gaps, or `npm run check:translations -- --strict-site` to require complete UI/prose coverage.

Video titles, event names, theme names, and product names retain their original wording. Quoted article prose is translated with its attribution preserved. Each language uses its own date and number formatting, while funding amounts remain in USD. Write those amounts with an explicit currency — `1,000,000 USD`, not `$1,000,000` — because a bare `$` is the local currency sign in several countries.

The separate `translate-news.yml` workflow runs after a successful English deployment, on manual dispatch, and hourly to retry unfinished translations. Adding a language to the registry includes it automatically.

## One Muse owner per language

For a large catch-up, such as adding many editions at once, `scripts/translate-owners.py`
starts one headless Muse session per language instead of one request per batch.
Each owner gets a workspace outside the repository (under
`~/.local/state/omarchy-owners/<repo>/<code>/`) holding a frozen snapshot of the
English sources, copies of the repository validators as `tools/validate.py`, and
its output files. The session translates UI strings, page blocks, and every
article over many steps, validating its own work as it goes. It cannot see the
repository, has no network, and cannot delegate to other agents.

```sh
scripts/translate-owners.py prepare --roster        # seed roster editions as drafts and build workspaces
scripts/translate-owners.py run                     # launch every owner, supervise, retry, resume
scripts/translate-owners.py status
scripts/translate-owners.py collect                 # validate again and write into src/i18n
scripts/translate-owners.py publish --locale de     # strict check, social fonts, build, verify, then drop draft
```

`prepare --roster` reads `plans/100-languages-roster.json` (generated by
`scripts/language-roster.py`) and adds each edition to the registry with
`draft: true` and empty catalogues. `run` resumes: complete owners are skipped,
incomplete or dead ones restart with a prompt pointing them at their own
validator output, and rate-limited sessions back off. `collect` only writes
translations that pass the same validators the workflow uses, keeps existing
reviewed values, and skips articles whose English changed after the snapshot so
the hourly workflow retranslates them. Review, run `npm run check:translations`,
build the edition, and remove `draft` when it is ready to publish.

## Publish to Cloudflare

`npm run deploy:locale -- da` uploads the already-built Danish output to an `omarchy-da` Worker and prints its workers.dev URL. Set `CLOUDFLARE_ACCOUNT_ID` and authenticate Wrangler first. With the local `cf` wrapper's keyring connection:

```sh
npm run build:locale -- da
export CLOUDFLARE_ACCOUNT_ID=<your-account-id>
CLOUDFLARE_API_TOKEN="$(secret-tool lookup service cloudflare account api-token)" npm run deploy:locale -- da
```

The token stays in the child process environment and is never written to the repository. Use `--dry-run` to validate deployment configuration without uploading.

To connect the registered domain, create its Cloudflare zone, preserve any existing DNS records, and set the assigned nameservers through the registrar. Once the zone is active, run the same deployment command with `--domain`. It attaches the language’s primary domain from the locale registry, and Cloudflare provisions HTTPS. This is a separate step from deploying the workers.dev preview.

Language and country publishing is automatic through `translate-news.yml`. Before building, the workflow checks the live Worker inventory against the registry so a deployed edition cannot silently lose updates. Manual deployment remains available for recovery.

## Language and country editions

The locale registry defines every deployed language and country edition. Country editions reuse English through `contentLocale: "en"`, while retaining their own domain, formatting locale, flag, and deployment so country-specific themes can be added independently. Keep all deployed editions in this registry: removing one stops its automatic updates without removing the live Worker. The global English edition remains at omarchy.org. Existing `www` domains are listed in `aliases` and preserved during deployment.

The language menu shows colored country flags and preserves the current pathname, query and fragment when the destination has a translation. Otherwise it opens that language’s home page. Labels use native names, and English uses a globe. The `flag` field supplies the two-letter country code when needed. Arabic declares `direction: "rtl"`.

Cloudflare custom domains handle routing and TLS directly. Registered national domains use their assigned Cloudflare nameservers; language subdomains use the omarchy.org zone. Verify HTTPS and the page language before publishing a new primary address.

| Language         | English name         | Primary address                            |
| ---------------- | -------------------- | ------------------------------------------ |
| English          | English              | [omarchy.org](https://omarchy.org)         |
| Dansk            | Danish               | [omarchy.dk](https://omarchy.dk)           |
| العربية          | Arabic               | [omarchy.ae](https://omarchy.ae)           |
| Suomi            | Finnish              | [omarchy.fi](https://omarchy.fi)           |
| Français         | French               | [omarchy.fr](https://omarchy.fr)           |
| Ελληνικά         | Greek                | [omarchy.gr](https://omarchy.gr)           |
| Magyar           | Hungarian            | [omarchy.hu](https://omarchy.hu)           |
| हिन्दी           | Hindi                | [omarchy.in](https://omarchy.in)           |
| Íslenska         | Icelandic            | [omarchy.is](https://omarchy.is)           |
| 日本語              | Japanese             | [omarchy.jp](https://omarchy.jp)           |
| 한국어              | Korean               | [omarchy.kr](https://omarchy.kr)           |
| Español (México) | Spanish (Mexico)     | [omarchy.mx](https://omarchy.mx)           |
| Filipino         | Filipino             | [omarchy.ph](https://omarchy.ph)           |
| Português        | Portuguese           | [omarchy.pt](https://omarchy.pt)           |
| Svenska          | Swedish              | [omarchy.se](https://omarchy.se)           |
| Türkçe           | Turkish              | [omarchy.tr](https://omarchy.tr)           |
| Tiếng Việt       | Vietnamese           | [vi.omarchy.org](https://vi.omarchy.org)   |
| اردو             | Urdu                 | [ur.omarchy.org](https://ur.omarchy.org)   |
| বাংলা            | Bengali              | [bn.omarchy.org](https://bn.omarchy.org)   |
| Català           | Catalan              | [ca.omarchy.org](https://ca.omarchy.org)   |
| සිංහල            | Sinhala              | [si.omarchy.org](https://si.omarchy.org)   |
| தமிழ்            | Tamil                | [ta.omarchy.org](https://ta.omarchy.org)   |
| ไทย              | Thai                 | [th.omarchy.org](https://th.omarchy.org)   |
| Oʻzbekcha        | Uzbek                | [uz.omarchy.org](https://uz.omarchy.org)   |
| Italiano         | Italian              | [it.omarchy.org](https://it.omarchy.org)   |
| 简体中文             | Chinese (Simplified) | [zh.omarchy.org](https://zh.omarchy.org)   |
| Polski           | Polish               | [pl.omarchy.org](https://pl.omarchy.org)   |
| Lietuvių         | Lithuanian           | [lt.omarchy.org](https://lt.omarchy.org)   |
| Gaeilge          | Irish                | [ga.omarchy.org](https://ga.omarchy.org)   |
| Nederlands       | Dutch                | [nl.omarchy.org](https://nl.omarchy.org)   |
| Norsk            | Norwegian            | [omarchy.no](https://omarchy.no)           |
| Русский          | Russian              | [ru.omarchy.org](https://ru.omarchy.org)   |
| Bahasa Indonesia | Indonesian           | [id.omarchy.org](https://id.omarchy.org)   |
| Deutsch          | German               | [de.omarchy.org](https://de.omarchy.org)   |
| Naijá            | Nigerian Pidgin      | [pcm.omarchy.org](https://pcm.omarchy.org) |
| मराठी            | Marathi              | [mr.omarchy.org](https://mr.omarchy.org)   |
| తెలుగు           | Telugu               | [te.omarchy.org](https://te.omarchy.org)   |
| Kiswahili        | Swahili              | [sw.omarchy.org](https://sw.omarchy.org)   |
| Hausa            | Hausa                | [ha.omarchy.org](https://ha.omarchy.org)   |
| ਪੰਜਾਬੀ           | Punjabi              | [pa.omarchy.org](https://pa.omarchy.org)   |
| فارسی            | Persian              | [fa.omarchy.org](https://fa.omarchy.org)   |
| አማርኛ             | Amharic              | [am.omarchy.org](https://am.omarchy.org)   |
| Basa Jawa        | Javanese             | [jv.omarchy.org](https://jv.omarchy.org)   |
| ગુજરાતી          | Gujarati             | [gu.omarchy.org](https://gu.omarchy.org)   |
| ಕನ್ನಡ            | Kannada              | [kn.omarchy.org](https://kn.omarchy.org)   |
| Yorùbá           | Yoruba               | [yo.omarchy.org](https://yo.omarchy.org)   |
| भोजपुरी          | Bhojpuri             | [bho.omarchy.org](https://bho.omarchy.org) |
| Bahasa Melayu    | Malay                | [ms.omarchy.org](https://ms.omarchy.org)   |
| မြန်မာ           | Burmese              | [my.omarchy.org](https://my.omarchy.org)   |
| پښتو             | Pashto               | [ps.omarchy.org](https://ps.omarchy.org)   |
| ଓଡ଼ିଆ            | Odia                 | [or.omarchy.org](https://or.omarchy.org)   |
| മലയാളം           | Malayalam            | [ml.omarchy.org](https://ml.omarchy.org)   |
| Українська       | Ukrainian            | [uk.omarchy.org](https://uk.omarchy.org)   |
| Afaan Oromoo     | Oromo                | [om.omarchy.org](https://om.omarchy.org)   |
| سنڌي             | Sindhi               | [sd.omarchy.org](https://sd.omarchy.org)   |
| मैथिली           | Maithili             | [mai.omarchy.org](https://mai.omarchy.org) |
| Basa Sunda       | Sundanese            | [su.omarchy.org](https://su.omarchy.org)   |
| नेपाली           | Nepali               | [ne.omarchy.org](https://ne.omarchy.org)   |
| Igbo             | Igbo                 | [ig.omarchy.org](https://ig.omarchy.org)   |
| Română           | Romanian             | [ro.omarchy.org](https://ro.omarchy.org)   |
| isiZulu          | Zulu                 | [zu.omarchy.org](https://zu.omarchy.org)   |
| Azərbaycan dili  | Azerbaijani          | [az.omarchy.org](https://az.omarchy.org)   |
| অসমীয়া          | Assamese             | [as.omarchy.org](https://as.omarchy.org)   |
| Soomaali         | Somali               | [so.omarchy.org](https://so.omarchy.org)   |
| Binisaya         | Cebuano              | [ceb.omarchy.org](https://ceb.omarchy.org) |
| isiXhosa         | Xhosa                | [xh.omarchy.org](https://xh.omarchy.org)   |
| Lingála          | Lingala              | [ln.omarchy.org](https://ln.omarchy.org)   |
| ខ្មែរ            | Khmer                | [km.omarchy.org](https://km.omarchy.org)   |
| Malagasy         | Malagasy             | [mg.omarchy.org](https://mg.omarchy.org)   |
| Afrikaans        | Afrikaans            | [af.omarchy.org](https://af.omarchy.org)   |
| Қазақ тілі       | Kazakh               | [kk.omarchy.org](https://kk.omarchy.org)   |
| Ikinyarwanda     | Kinyarwanda          | [rw.omarchy.org](https://rw.omarchy.org)   |
| Kurdî            | Kurdish              | [ku.omarchy.org](https://ku.omarchy.org)   |
| Chichewa         | Chichewa             | [ny.omarchy.org](https://ny.omarchy.org)   |
| Bamanankan       | Bambara              | [bm.omarchy.org](https://bm.omarchy.org)   |
| Čeština          | Czech                | [cs.omarchy.org](https://cs.omarchy.org)   |
| Kreyòl ayisyen   | Haitian Creole       | [ht.omarchy.org](https://ht.omarchy.org)   |
| Wolof            | Wolof                | [wo.omarchy.org](https://wo.omarchy.org)   |
| Akan             | Akan                 | [ak.omarchy.org](https://ak.omarchy.org)   |
| chiShona         | Shona                | [sn.omarchy.org](https://sn.omarchy.org)   |
| Luganda          | Luganda              | [lg.omarchy.org](https://lg.omarchy.org)   |
| Ikirundi         | Kirundi              | [rn.omarchy.org](https://rn.omarchy.org)   |
| Türkmen dili     | Turkmen              | [tk.omarchy.org](https://tk.omarchy.org)   |
| ئۇيغۇرچە         | Uyghur               | [ug.omarchy.org](https://ug.omarchy.org)   |
| Тоҷикӣ           | Tajik                | [tg.omarchy.org](https://tg.omarchy.org)   |
| Српски           | Serbian              | [sr.omarchy.org](https://sr.omarchy.org)   |
| עברית            | Hebrew               | [he.omarchy.org](https://he.omarchy.org)   |
| ትግርኛ             | Tigrinya             | [ti.omarchy.org](https://ti.omarchy.org)   |
| Български        | Bulgarian            | [bg.omarchy.org](https://bg.omarchy.org)   |
| Slovenčina       | Slovak               | [sk.omarchy.org](https://sk.omarchy.org)   |
| Հայերեն          | Armenian             | [hy.omarchy.org](https://hy.omarchy.org)   |
| Shqip            | Albanian             | [sq.omarchy.org](https://sq.omarchy.org)   |
| Hrvatski         | Croatian             | [hr.omarchy.org](https://hr.omarchy.org)   |
| ລາວ              | Lao                  | [lo.omarchy.org](https://lo.omarchy.org)   |
| Avañeʼẽ          | Guarani              | [gn.omarchy.org](https://gn.omarchy.org)   |
| Монгол           | Mongolian            | [mn.omarchy.org](https://mn.omarchy.org)   |
| Кыргызча         | Kyrgyz               | [ky.omarchy.org](https://ky.omarchy.org)   |
| Беларуская       | Belarusian           | [be.omarchy.org](https://be.omarchy.org)   |
| ქართული          | Georgian             | [ka.omarchy.org](https://ka.omarchy.org)   |
| Slovenščina      | Slovenian            | [sl.omarchy.org](https://sl.omarchy.org)   |

## Pointing a new domain to a language site

A domain owner can provide the new primary address for a language while keeping ownership and registration with their current registrar. The Omarchy maintainer hosts the site in the project’s Cloudflare account. No registrar transfer is required.

### Domain owner

1. Tell the maintainer the exact domain and intended language. Disclose any existing website, email service or other use of the domain so its DNS records can be preserved.
2. Keep the domain registered and renewed in your own account. Give the maintainer the existing DNS records, including MX and TXT records used for email and verification. Do not send registrar passwords.
3. Wait for the maintainer to confirm that the Cloudflare zone contains the required records and to supply the nameservers assigned to that specific zone. Enter those exact nameservers at your registrar. Do not copy nameservers from another domain or guess their values.
4. Confirm with the maintainer that the website and any existing email service work after the change.

### Omarchy maintainer

1. Add the domain as a zone in the project’s Cloudflare account. Review the imported DNS records with the owner and preserve all required records, particularly MX and TXT records. Resolve any conflicting website records deliberately; do not discard unrelated records. Coordinate any existing DNSSEC configuration before changing nameservers.
2. Send the owner the nameservers Cloudflare assigned to this zone. After the owner applies them, wait for Cloudflare to mark the zone active.
3. Prepare the replacement `domain` value for the existing language in `src/i18n/locales.json`. Keep one primary address; do not add an alias or another edition. Build with `npm run build:locale -- <code>`, then deploy with `npm run deploy:locale -- <code> --domain`. This attaches the Worker custom domain and lets Cloudflare provision HTTPS. Do not publish the registry change to master until the new address is verified.
4. Verify DNS resolution, a valid HTTPS certificate, the intended language on the home page and a news article deep link. Check that the article path survives navigation and that canonical URLs identify the new primary address. Check existing email DNS with the owner as well.
5. Publish the registry change and rebuild/deploy the sites so the language selector and alternate-language links use the verified new address. Once the switch is confirmed, remove the previous Worker custom-domain attachment and retire the previous address rather than retaining it as an alias.

A DNS CNAME pointing an arbitrary domain at an omarchy.org hostname is not sufficient: it does not configure Worker routing or provide a certificate for that domain. Use the zone and Worker custom-domain handoff above. Nameserver changes affect the whole domain, so preserving existing DNS records is part of the handoff, not an optional cleanup step.

## Translating the manual next

Keep English chapters in the existing source repository. Store translations separately using stable chapter paths and section IDs, with a hash of the English source beside each translated section. Preserve executable commands, filenames and the interface's actual menu labels. When the source changes, require review of only the affected sections. Until a section is translated, render its English source with a clear language notice; never leave installation instructions missing. Enable a locale's `manual` flag only after the translated routing, fallback and source-freshness checks are implemented.

## Publish English first, translate afterward

Push English component, prose, or Markdown news changes to master. The Pages workflow renders the Markdown and deploys English without waiting for any translations. After that deployment succeeds, the translation workflow regenerates the same English source, finds missing UI/prose keys and missing or stale news by source hash, and starts a separate GitHub Actions runner for each language with pending work. Each runner processes only that language, with the site and news queues running concurrently and up to two Muse requests per queue (four per runner). Languages without pending translations do not start a Muse runner. GitHub runs the language matrix in parallel up to the account’s runner capacity; Muse rate limits can also affect throughput. News does not wait behind site-copy translations. UI/prose batches contain at most 20 strings or 8,000 source characters (an indivisible longer HTML block remains intact). Each result must preserve HTML structure and links before it is saved; UI/prose also validates placeholders, numeric values, and command literals. Shared layout, styling, images, and code changes reach every language through the same builds without requiring translation. Runners upload only their own language changes as artifacts from the same source revision. One collection job validates and commits the combined results, so language runners never compete to push to master. Successful translations are committed by the Actions bot; failed items remain queued for the hourly retry. A newer English edit invalidates older translations automatically.

The workflow builds and deploys language sites in a separate six-runner matrix. A model failure does not roll back English publication. If a language deployment fails, the hourly run retries deployment; you can also rerun failed jobs or manually dispatch the workflow. Concurrent runs are serialized; if a rebase conflicts with an editorial change, no forced push is attempted and the next run starts from current master.

Configure these repository Actions settings:

- Secret `MUSE_API_KEY`: Muse provider key.
- Secret `CLOUDFLARE_DEPLOY_API_TOKEN`: Workers deployment and custom-domain permissions; separate from the analytics token.
- Variable `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account hosting the language Workers.
- Optional variable `MUSE_MODEL`: defaults to `muse-spark-1.3-contributor`.
- Optional variable `LANGUAGE_DEPLOY_PARALLEL`: how many language builds deploy at once (default 6). GitHub-hosted runners on the Free plan allow 20 concurrent jobs for the whole account, shared with the translation matrix and the English deploy.

The repository must allow GitHub Actions to write commits to master (or grant the bot the appropriate ruleset bypass). The workers only run on trusted master after the English workflow, never on pull-request code. Bot translation commits do not trigger the English workflow again; the same translation run publishes its own results.

For a local catch-up, run `bin/build-news`, `npm run port`, then `npm run site:translate` and `npm run news:translate`. The Muse CLI must be installed and authenticated. `npm run site:pending` and `npm run news:pending` report remaining queues without invoking a model. Pass `-- --locale da` to either translation command to process just Danish; `--limit` is applied after language selection. Use `npm run check:translations -- --strict-site --strict-news` after a full catch-up. The manual remains English until the separate manual workflow is implemented.
