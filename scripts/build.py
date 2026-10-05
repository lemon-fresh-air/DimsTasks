from hashlib import sha256
from pathlib import Path
from shutil import copy2, copytree

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
CSS_FILES = [ROOT / "src/css/tokens.css", ROOT / "src/css/base.css", ROOT / "src/css/app.css"]
JS_FILES = [ROOT / "src/js/db.js", ROOT / "src/js/import-export.js", ROOT / "src/js/ui.js", ROOT / "src/js/app.js"]
HTML_FILE = ROOT / "src/html/app.html"
STATIC = ROOT / "static"

required = [HTML_FILE, *CSS_FILES, *JS_FILES, STATIC / "manifest.webmanifest", STATIC / "service-worker.js", STATIC / "icons/icon.svg"]
missing = [str(path.relative_to(ROOT)) for path in required if not path.exists()]
if missing:
    raise SystemExit("Missing required files: " + ", ".join(missing))

css = "\n\n".join(path.read_text(encoding="utf-8") for path in CSS_FILES)
js = "\n\n".join(path.read_text(encoding="utf-8") for path in JS_FILES)
body = HTML_FILE.read_text(encoding="utf-8")
document = f'''<!doctype html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#1e293b">
  <meta name="description" content="Персональний local-first таск-менеджер">
  <link rel="manifest" href="./manifest.webmanifest">
  <link rel="icon" href="./icons/icon.svg" type="image/svg+xml">
  <title>DimsTasks</title>
  <style>\n{css}\n  </style>
</head>
<body>
{body}
<script>\n{js}\n</script>
</body>
</html>
'''
if "__BUILD_ID__" in document:
    raise SystemExit("Unresolved placeholder in index.html")

build_id = sha256(document.encode("utf-8")).hexdigest()[:12]
DIST.mkdir(exist_ok=True)
(DIST / "index.html").write_text(document, encoding="utf-8", newline="\n")
copy2(STATIC / "manifest.webmanifest", DIST / "manifest.webmanifest")
service_worker = (STATIC / "service-worker.js").read_text(encoding="utf-8").replace("__BUILD_ID__", build_id)
if "__BUILD_ID__" in service_worker:
    raise SystemExit("Unresolved build identifier")
(DIST / "service-worker.js").write_text(service_worker, encoding="utf-8", newline="\n")
copytree(STATIC / "icons", DIST / "icons", dirs_exist_ok=True)
print(f"Built DimsTasks {build_id} -> {DIST}")

