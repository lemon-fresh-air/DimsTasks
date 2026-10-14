# DimsTasks

Local-first PWA task manager. All user-facing text is in Ukrainian. Mobile-first. No dependencies, backend, or accounts. Data lives in the browser's IndexedDB.

## Build

* Windows: `py scripts/build.py`, then `python scripts/build.py` → `dist/`. Inside Codex the `WindowsApps` launchers can fail; then use `C:\Users\38066\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`. Do not retry a failing launcher more than once.
* The script runs from any directory. Run it after every completed change.
* Edit only `src/`, `static/`, `tests/`, and `docs/`. `dist/` is generated: never edit or commit it.
* JS order is set in `scripts/build.py`: db → model → import-export → ui → app. Add new JS files to that list. CSS order: tokens → base → app.
* `dist/` has only `index.html` (CSS and JS inlined), `service-worker.js`, `manifest.webmanifest`, `icons/`. There is no `app.js`, so never run `node --check` on `dist/`.
* CI builds with `python scripts/build.py` on Linux. Leave it unchanged.

## Where things are

* `src/js/db.js`: IndexedDB, `DB_VERSION`, upgrade steps
* `src/js/model.js`: entity factories, computed rules
* `src/js/import-export.js`: backup format
* `src/js/ui.js`, `src/js/app.js`: rendering, events, startup
* `src/html/app.html`: markup
* `src/css/`: styles and tokens
* `static/`: manifest, service worker, icons (copied to `dist/`)
* `docs/data-model.md`: data model and extension rules
* `docs/product.md`: user, primary action, first-screen priorities, visual direction

## Verifying changes

Use the lightest level that covers the change.

**Level 1: visual and small changes**

1. Build.
2. `node --check src/js/<file>.js` for each changed JS file (Codex runtime Node). The build only concatenates and does not catch syntax errors.
3. Tell the user to open `dist\index.html` and list the exact steps to click. No server, browser, or screenshots.

**Level 2: logic changes (`model.js`, sorting, filters, next-step rules)**

`model.js` is DOM-free. Tests live in `tests/*.test.js`, run with `node --test "tests/*.test.js"` (Codex runtime Node; the bare `tests/` form fails on Node 24 for Windows). Load the file via `vm`; pass `crypto` and `INBOX_LIST_ID` (value from `db.js`) into the context. Priority coverage: `reorderLists`, `reorderTaskBlock`, `normalizeTaskOrder`, `compareTodayTasks`, `currentProjectTask`. Keep `document`, `window`, and IndexedDB out of `model.js`; put such code in `ui.js` or `db.js`.

**Level 3: data, storage, import/export, migrations, or when the user asks**

1. Playwright headless through the Codex runtime Node (`NODE_PATH` is the `node_modules` next to it), Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe`, viewport 390×844.
2. The Playwright script itself spawns the server (`py -m http.server 8000 --bind 127.0.0.1 --directory dist`) and kills it at the end, so both share one network context. URL `http://127.0.0.1:8000`.
3. Launch Chrome with `--no-proxy-server` and set `NO_PROXY=127.0.0.1,localhost,::1` (also lowercase).
4. Cover the main action, cancel, save, persistence after reload, and one neighbouring feature. Collect console errors.
5. Service worker and offline behavior need localhost. `file://` is acceptable for plain markup, and the report must say it was used.

**On failure to reach localhost** (timeout, `ERR_CONNECTION_*`): do not blame the environment right away. Run `curl.exe -sI http://127.0.0.1:8000` and `Get-ChildItem Env: | Select-String proxy`, then retry once with the proxy bypass. If it still fails, fall back to `file://` or Level 2, and give the user a manual click checklist.

**Report:** state which level ran, what was checked, and the result. If something was skipped, name the exact diagnostic output that justifies it.

Never use Browser Use or Computer Use for verification. They load large instructions and cannot reach localhost in this setup.

## File format

Files in `src/` use CRLF. Do not convert or investigate line endings. For `git diff --check` add `-c core.whitespace=cr-at-eol`.

## Reading files

Read each file once. Use targeted ranges (`rg -n`, line ranges) for large files. Do not re-read a file already read in this session.

## Invariants

* No npm, frameworks, CDN, backend, or analytics without explicit approval.
* Read `docs/data-model.md` before any schema change. A migration never clears or recreates the database.
* No new browser permissions (notifications, geolocation, camera) without agreement.
* Paths stay relative and compatible with a GitHub Pages subpath.
* Never touch the user's real data while testing.

## Deploy

Push to `main` triggers `.github/workflows/pages.yml`, which builds `dist/` and publishes to Pages. Push, repository changes, and Pages settings only with the user's direct permission.
