# Vibe Coding Workflow Agreement

This workflow is designed for a non-developer building a real product with Antigravity 2.0.
The AI writes all code; the user reviews **behavior**, not code. Everything exists to make development safe, cheap, and reversible.

---

## Core Rhythm

**One chat = one task.** Each session:
1. Pick one task from `PROGRESS.md`.
2. The AI builds it.
3. Verify it works (tests, linters, visual check).
4. Run the `/wrap` ritual: commit to Git, update `PROGRESS.md`, provide plain-language summary.
5. User clicks **"+" (New Conversation)** in Antigravity to start a fresh chat for the next task.

---

## Bedrock Principles

1. **Git from Day One**: Every working step is committed. Roll back anytime if needed.
2. **`AGENTS.md` — Project Brain**: Keep it short; auto-read every session.
3. **Decisions & Progress in Files**: `PLAN.md` (what & why), `PROGRESS.md` (where we are), `WORKFLOW.md` (how we work).
4. **Automated Verification**: Tests and translation checkers prove things work.
5. **Plain-Language & Behavior Review**: Explain *what* and *why*, never internal code trivia.
6. **Cheapest Labor Division**: Fast path for browser checks, UI review, or account setup given as step-by-step instructions.

---

## Project-Specific Rules (Omarchy Translation)

1. **Translation Integrity**: Do not translate product names (Omarchy, Hyprland, Waybar, etc.), command-line invocations, keyboard shortcuts (e.g. `Super+Space`), internal URLs, or application menu paths.
2. **Exact HTML Matching**: Prose blocks in `blocks.json` must match the English source HTML keys exactly to preserve formatting and links.
3. **Upstream Compliance**: Always ensure `npm test` and `npm run check:translations` pass before wrapping any translation session.
