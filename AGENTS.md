# Georgian Localization of omarchy.org

Translating the official Omarchy website (omarchy.org) into Georgian (ka) for Georgian-speaking Omarchy users and the Linux community.

Read first: PLAN.md (what & why) · PROGRESS.md (where we are) · WORKFLOW.md (how we work).

## Stack
- Framework: Astro (Node.js v26+, npm)
- Scripts: Node.js (ESM) + Python 3.14
- Deployment target: Static site / Cloudflare Worker (ge.omarchy.org)
- Upstream: omacom/omarchy-site (master branch)

## Commands
- Test: `npm test`
- Check translations: `npm run check:translations`
- Populate translation stubs: `npm run site:translate`
- Build Georgian locale: `npm run build:locale -- ka`
- Preview Georgian locale: `npm run dev:ka`

## Rules
- The user is a non-developer. Explain changes in plain language: what and why, not how.
- One chat = one task: build → verify → commit → update PROGRESS.md (`/wrap` does this).
- Translation integrity: Preserve product names, commands, keyboard shortcuts, URLs, and menu paths per `docs/translations.md`.
- Keep `manual: false` in `src/i18n/locales.json` until the documentation manual is translated.
- Preserved HTML keys: Block translation keys must match original English HTML precisely.
- Never commit secrets. Keys live only in `.env` (git-ignored).
