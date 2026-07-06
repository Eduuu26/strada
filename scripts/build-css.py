import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
layout = (ROOT / "assets/css/layout.css").read_text(encoding="utf-8")
base = (ROOT / "assets/css/app-base.css").read_text(encoding="utf-8")

skip_blocks = {
    ":root {", "body {", ".preview-header {", ".feature-pills {", ".feature-pill {",
    ".phone-wrap {", ".phone-frame {", ".phone-screen {", ".status-bar {", ".notch {",
    ".desktop-tabs {", ".desktop-tabs button {", ".desktop-tabs button.active {",
    ".preview-version {", ".welcome-banner {", ".welcome-banner .dismiss {",
}

lines = []
depth = 0
skip_depth = None
for line in base.splitlines():
    stripped = line.strip()
    if skip_depth is not None:
        depth += line.count("{") - line.count("}")
        if depth <= skip_depth:
            skip_depth = None
        continue
    for block in skip_blocks:
        if stripped.startswith(block):
            skip_depth = depth + line.count("{") - line.count("}")
            break
    else:
        if stripped.startswith(".modal-overlay {") or stripped.startswith(".toast {"):
            continue
        if stripped.startswith(".app-header {") or stripped.startswith(".content {"):
            continue
        if stripped.startswith(".tab-bar {") or stripped.startswith(".tab {"):
            continue
        if stripped.startswith("#mainShell {") or stripped.startswith("#mainShell.hidden"):
            continue
        if stripped.startswith(".screen-detail,") or stripped.startswith(".screen-auth {"):
            continue
        lines.append(line)
    depth += line.count("{") - line.count("}")

(ROOT / "assets/css/app.css").write_text(layout + "\n" + "\n".join(lines), encoding="utf-8")
print("wrote app.css")
