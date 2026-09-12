# Progress

**Current phase:** Phase 4 — Main Page Prose Blocks Localization complete. All 118 authored HTML prose blocks in `src/i18n/ka/blocks.json` translated into Georgian, 0 pending blocks, and 100% tests passing.

**Next task:** Phase 5 — Translate news articles in `src/i18n/ka/news.json` and `src/i18n/ka/news/*.html` (26 articles, preserving formatting, source hashes, and slugs) and verify with `npm run check:translations -- --strict-news`.

## Done
- 2026-09-12 — Phase 4: Translated all 118 authored HTML prose blocks in `src/i18n/ka/blocks.json` into natural Georgian, preserved all HTML tags, attributes, and links, applied explicit USD formatting, verified with 0 pending site items, 82 passing tests, and successful `npm run build:locale -- ka`.
- 2026-09-12 — Phase 3: Translated all 338 UI messages in `src/i18n/messages/ka.json` into natural Georgian, preserved all brand names, shortcuts, and commands, applied explicit USD formatting, updated 22 social card preview PNGs, verified with 0 pending messages, 82 passing tests, and successful `npm run build:locale -- ka`.
- 2026-09-12 — Phase 2: Registered Georgian (`ka`) in `src/i18n/locales.json`, created translation catalogs (`src/i18n/messages/ka.json` with 338 UI keys, `src/i18n/ka/blocks.json` with 118 page blocks, `src/i18n/ka/news.json` with 26 news articles and SHA-256 hashes), added Noto Sans Georgian font and manifest mapping, generated 22 social card PNGs, verified with 82 passing tests and successful `npm run build:locale -- ka`.
- 2026-09-12 — Initialized project: created GitHub fork `razmikb/omarchy-site`, pulled upstream master, created `ka-translation` branch, installed npm dependencies, verified 100% passing tests (48 node tests, 34 python tests, translation check), and created the 4 core Vibe Workflow files (`AGENTS.md`, `PLAN.md`, `PROGRESS.md`, `WORKFLOW.md`).

## Known issues / deferred
- None.
