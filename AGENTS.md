# DimsTasks

Local-first PWA task manager. All user-facing text is in Ukrainian. Mobile-first. No dependencies, backend, or accounts. Data lives in the browser's IndexedDB.

## Runtimes (Codex, Windows)

- Root: `C:\Users\38066\.cache\codex-runtimes\codex-primary-runtime\dependencies`
- Python: `<root>\python\python.exe`. Node: `<root>\node\bin\node.exe`. Playwright `NODE_PATH`: `<root>\node\node_modules`.
- Use these paths directly. The WindowsApps `py` and `python` launchers fail in Codex, so do not try them.
- Outside Codex (the user's own terminal): `py scripts/build.py`.

## Build

- `<python> scripts/build.py` → `dist/`. The script runs from any directory. Run it after every completed change.
- Edit only `src/`, `static/`, `tests/`, and `docs/`. `dist/` is generated: never edit or commit it.
- JS order is set in `scripts/build.py` (source of truth): db → model → import-export → ui → projects → app. Add new JS files to that list. CSS order: tokens → base → app.
- `dist/` has only `index.html` (CSS and JS inlined), `service-worker.js`, `manifest.webmanifest`, `icons/`. There is no `app.js`, so never run `node --check` on `dist/`.
- CI builds with `python scripts/build.py` on Linux. Leave it unchanged.

## Where things are

- `src/js/db.js`: IndexedDB, `DB_VERSION`, upgrade steps
- `src/js/model.js`: entity factories, computed rules
- `src/js/import-export.js`: backup format
- `src/js/ui.js`, `src/js/projects.js`, `src/js/app.js`: rendering, project flows, events, startup
- `src/html/app.html`: markup
- `src/css/`: styles and tokens
- `static/`: manifest, service worker, icons (copied to `dist/`)
- `docs/data-model.md`: data model and extension rules
- `docs/product.md`: user, primary action, first-screen priorities, visual direction
- `tests/*.test.js`: model tests (`node --test`). `tests/e2e-*.js`: browser scenarios, run directly with Node.

## Reading files

- Read each file once. Do not re-read a file already read in this session.
- Files over 300 lines (`app.js`, `ui.js`, `app.css`): locate with `rg -n` first, then read one line range with line numbers.
- One large file per command. Never `Get-Content -Raw` on several large files in one command: the output is truncated and forces a second read.
- Read `css/`, `tests/`, and `scripts/build.py` only when the task changes them.
- Read `docs/data-model.md` before any schema change.
- Skills: load a skill when its step starts. `pwa-debug` and its regression matrix are needed only for Level 3.

## Verifying changes

Use the lightest level that covers the change. Run verification once, at the end of the task. After later logic edits, re-run only the Level 2 tests.

**Level 1: UI and small changes**

2. Build.
4. `node --check src/js/<file>.js` for each changed JS file. The build only concatenates and does not catch syntax errors.
6. Give the user an exact click checklist for `dist\index.html`. No server, browser, or screenshots.

**Level 2: logic changes (`model.js`, sorting, filters, next-step rules)**

`model.js` is DOM-free. Tests live in `tests/*.test.js` and run with `node --test "tests/*.test.js"` (the bare `tests/` form fails on Node 24 for Windows). Load the file via `vm`; pass `crypto` and `INBOX_LIST_ID` (value from `db.js`) into the context. Add or update a test for every changed rule. Priority coverage: `reorderLists`, `reorderTaskBlock`, `normalizeTaskOrder`, `compareTodayTasks`, `currentProjectTask`. Keep `document`, `window`, and IndexedDB out of `model.js`; put such code in `ui.js` or `db.js`.

**Level 3: browser test**

Run it when the user asks, when a new screen or user flow is added, or when schema, `DB_VERSION`, a migration that rewrites records, or import/export changed. Skip it for visual tweaks and text changes (Level 1).

Use only the method below, which is known to work in this environment. Do not try alternatives (localhost, a server, other browsers, Browser Use, Computer Use). If the method fails, apply the 3-fix limit in step 5.

2. Open `dist/index.html` through `file://`. Never use localhost. In this environment Chrome gets `ERR_CONNECTION_TIMED_OUT` even with the server running and the proxy bypassed (confirmed in two projects). Do not start a server, and skip curl and proxy diagnostics.
4. Playwright headless through the Codex Node, Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe`, viewport 390×844, a fresh temporary profile on every run so real data stays untouched.
6. Reuse `tests/e2e-helper.js` (launch, open the `file://` page, collect console errors, clean up; no server code). If it does not exist yet, extract it once from `tests/e2e-projects.js` and make `file://` the default there.
8. One scenario per feature: main action, cancel, save, persistence after reload, one neighbouring feature. Use explicit waits on elements, no fixed sleeps. Read results from IndexedDB and visible text.
10. Fix the test script at most 3 times. If it still fails, stop and give the user a manual checklist together with the exact failure message.

**Not testable here:** service worker, offline, install prompt. When a change touches them, list them in the report as "not verified, manual check". Never call them verified.

**Report:** the level that ran, what was checked, the result, and what was skipped with the exact reason.

Never use Browser Use or Computer Use for verification. They load large instructions and cannot reach localhost in this setup.

## File format

Files in `src/` use CRLF. Do not convert or investigate line endings. For `git diff --check` add `-c core.whitespace=cr-at-eol`.

## Invariants

- No npm, frameworks, CDN, backend, or analytics without explicit approval.
- A migration never clears or recreates the database.
- No new browser permissions (notifications, geolocation, camera) without agreement.
- Paths stay relative and compatible with a GitHub Pages subpath.
- Never touch the user's real data while testing.

## Deploy

Push to `main` triggers `.github/workflows/pages.yml`, which builds `dist/` and publishes to Pages. Push, repository changes, and Pages settings only with the user's direct permission.
