# Georgian Localization of omarchy.org — Agreed Plan

*Finalized 2026-09-12 after Step 0 discussion.*

## 1. What we're building
Translating the official Omarchy Linux distribution website ([omarchy.org](https://omarchy.org)) into Georgian (`ka`).
This will make Omarchy accessible to Georgian speakers with natural, accurate Georgian terminology while keeping commands, shortcuts, and technical identifiers consistent with the upstream operating system.

## 2. Decisions made
| Question | Decision |
|---|---|
| Purpose | Real open-source contribution to upstream Omarchy |
| Target language | Georgian (`ka` / `ka-GE`) |
| Domain / URL | `ge.omarchy.org` (until official custom domain is assigned) |
| Manual status | `manual: false` initially (translating main site and news first per upstream rules) |
| Who codes / translates | AI generates translations and code; Razmik reviews Georgian phrasing and site behavior |
| Git upstream | Fork at `razmikb/omarchy-site`, upstream at `omacom/omarchy-site` |

## 3. Architecture & Translation Files
- `src/i18n/locales.json` — Language registration (code, native name "ქართული", domain `ge.omarchy.org`, formatting locale `ka-GE`, ogLocale `ka_GE`).
- `src/i18n/messages/ka.json` — UI copy translations (English source strings as keys).
- `src/i18n/ka/blocks.json` — Authored HTML prose on main pages (original HTML as keys).
- `src/i18n/ka/news.json` & `news/*.html` — Translated news headlines, SHA-256 source hashes, and translated article HTML.

## 4. Phases
1. **Phase 1: Project Setup & Baseline** *(Current)*
   - Fork repo, configure remotes, install dependencies, verify baseline checks (`npm test`, `npm run check:translations`), establish Vibe Workflow files.
   - *Finish line*: All tests pass, repo clean, workflow files in place.
2. **Phase 2: Register Locale & Generate Message Stubs**
   - Add Georgian (`ka`) entry to `src/i18n/locales.json` and generate extraction stubs with `npm run site:translate`.
   - *Finish line*: `ka` registered, stubs created, scripts recognize Georgian locale.
3. **Phase 3: Translate UI Messages**
   - Translate all UI strings in `src/i18n/messages/ka.json` with high-quality Georgian translations.
   - *Finish line*: UI strings translated, passes message validation in `npm run check:translations`.
4. **Phase 4: Translate Main Page Prose Blocks**
   - Translate authored HTML prose in `src/i18n/ka/blocks.json`.
   - *Finish line*: Block translations complete, exact HTML markup preserved.
5. **Phase 5: Translate News Articles**
   - Translate news posts in `src/i18n/ka/news.json` and article HTML files with correct SHA-256 source hashes.
   - *Finish line*: News posts translated and verified with `npm run check:translations -- --strict-news`.
6. **Phase 6: Verification, Local Preview & PR Submission**
   - Build preview with `npm run build:locale -- ka`, verify visually in browser via `npm run dev:ka`.
   - Prepare PR for upstream `omacom/omarchy-site`.
   - *Finish line*: Full site builds cleanly, passes all checks, and PR is opened upstream.

## 5. Open questions
- None currently.
