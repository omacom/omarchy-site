# Progress

**Current phase:** Phase 2 — Locale Registration & Translation Catalogs complete. Georgian (`ka`) registered in `src/i18n/locales.json`, all UI/prose/news catalogs and stubs generated, font support configured, social cards generated, and 100% tests passing.

**Next task:** Phase 3 — Translate all UI messages in `src/i18n/messages/ka.json` with high-quality Georgian translations and verify with `npm run check:translations`.

## Done
- 2026-09-12 — Phase 2: Registered Georgian (`ka`) in `src/i18n/locales.json`, created translation catalogs (`src/i18n/messages/ka.json` with 338 UI keys, `src/i18n/ka/blocks.json` with 118 page blocks, `src/i18n/ka/news.json` with 26 news articles and SHA-256 hashes), added Noto Sans Georgian font and manifest mapping, generated 22 social card PNGs, verified with 82 passing tests and successful `npm run build:locale -- ka`.
- 2026-09-12 — Initialized project: created GitHub fork `razmikb/omarchy-site`, pulled upstream master, created `ka-translation` branch, installed npm dependencies, verified 100% passing tests (48 node tests, 34 python tests, translation check), and created the 4 core Vibe Workflow files (`AGENTS.md`, `PLAN.md`, `PROGRESS.md`, `WORKFLOW.md`).

## Known issues / deferred
- None.
