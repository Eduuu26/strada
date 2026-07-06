import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
text = (ROOT / "preview.html").read_text(encoding="utf-8")

start = text.index('<div id="toast"')
end = text.index('<div class="desktop-tabs"')
inner = text[start:end]

inner = re.sub(
    r'<div class="notch"></div>\s*<div class="status-bar">.*?</div>\s*',
    "",
    inner,
    flags=re.S,
)
inner = re.sub(
    r'<div id="welcomeBanner" class="welcome-banner" hidden>.*?</div>\s*',
    "",
    inner,
    flags=re.S,
)

# wrap content panels in content-inner
inner = inner.replace(
    '<div class="content">',
    '<div class="content"><div class="content-inner">',
    1,
)
# close content-inner before tab-bar - find first tab-bar after content
inner = inner.replace(
    '\n          </div>\n\n          <nav class="tab-bar">',
    '\n          </div></div>\n\n          <nav class="tab-bar">',
    1,
)

(ROOT / "assets/inner.html").write_text(inner, encoding="utf-8")
print("inner", len(inner))
