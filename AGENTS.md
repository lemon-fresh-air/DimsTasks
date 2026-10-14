# DimsTasks

Local-first PWA task manager. All user-facing text is in Ukrainian. Mobile-first. No dependencies, backend, or accounts. Data lives in the browser's IndexedDB.

## Build

* \- Windows: try `py scripts/build.py` first, then `python scripts/build.py` → `dist/`. Both work in the user's own terminal (Python 3.14). Inside Codex sessions the launchers in `WindowsApps` can fail to start; in that case use the Codex runtime Python: `C:\\\\Users\\\\38066\\\\.cache\\\\codex-runtimes\\\\codex-primary-runtime\\\\dependencies\\\\python\\\\python.exe`. Do not retry the failing launcher more than once.
* The script runs from any directory. Run it after every completed change.
* Edit only `src/` and `static/`. `dist/` is generated: never edit it, never commit it (it is in `.gitignore`).
* JS order is set in `scripts/build.py`: db → model → import-export → ui → app. Add new JS files to that list.
* CSS order: tokens → base → app.
* `dist/` contains only `index.html` (CSS and JS inlined), `service-worker.js`, `manifest.webmanifest`, `icons/`. There is no separate `app.js`, so never run `node --check` on `dist/`.
* CI builds with `python scripts/build.py` on Linux. Leave it unchanged.

## Where things are

* `src/js/db.js`: IndexedDB, `DB\\\_VERSION`, upgrade steps
* `src/js/model.js`: entity factories, computed rules
* `src/js/import-export.js`: backup format
* `src/js/ui.js`, `src/js/app.js`: rendering, events, startup
* `src/html/app.html`: markup
* `src/css/`: styles and tokens
* `static/`: manifest, service worker, icons (copied to `dist/`)
* `docs/data-model.md`: data model and extension rules
* `docs/product.md`: user, primary action, first-screen priorities, visual direction

## Verifying changes



Default (visual and small changes):

1\. Build.

2\. Syntax-check each changed JS file with the Codex runtime Node: `node --check src/js/<file>.js`. The build only concatenates files and does not catch syntax errors.

3\. Tell the user to open `dist\\index.html` from the project root, and list the exact steps to click. Do not start a server, a browser, or take screenshots.



Extended (only when the user asks, or the change touches data, storage, import/export, or migrations):

1\. Serve from the project root: `py -m http.server 8000 --bind 127.0.0.1 --directory dist` (or pass an absolute path to `--directory`).

2\. Test with headless Playwright through the Codex runtime Node, using Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe`, viewport 390×844, URL `http://127.0.0.1:8000`. `NODE\_PATH` is the `node\_modules` folder next to the runtime Node.

3\. Cover the main action, cancel, save, persistence after reload, and one neighbouring feature. Collect console errors.

4\. Service worker and offline behavior need localhost. A `file://` check is acceptable for plain markup, and the report must say it was used.



Never use Browser Use or Computer Use for verification. They load large instructions and cannot reach localhost in this setup.File format

Files in `src/` use CRLF. Do not convert or investigate line endings. When running `git diff --check`, add `-c core.whitespace=cr-at-eol`.

## Reading files

Read each file once. Use targeted ranges (`rg -n`, line ranges) for large files. Do not re-read a file already read in this session.

## Invariants

* No npm, frameworks, CDN, backend, or analytics without explicit approval.
* Read `docs/data-model.md` before any schema change. A migration never clears or recreates the database.
* No new browser permissions (notifications, geolocation, camera) without agreement.
* Paths stay relative and compatible with a GitHub Pages subpath.
* Never touch the user's real data while testing.

## Deploy

Push to `main` triggers `.github/workflows/pages.yml`, which builds `dist/` and publishes it to Pages. Push, repository changes, and Pages settings only with the user's direct permission.

