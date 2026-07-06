import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
js = (ROOT / "assets/js/app.js").read_text(encoding="utf-8")

# Dedent
lines = js.splitlines()
if lines and lines[0].startswith("    "):
    lines = [ln[4:] if ln.startswith("    ") else ln for ln in lines]
js = "\n".join(lines)

migration = '''
function migrateLegacyStorage() {
  const pairs = [
    ['rutasapp_users_v3', USERS_KEY],
    ['rutasapp_session_v3', SESSION_KEY],
    ['rutasapp_custom_routes_v3', CUSTOM_ROUTES_KEY],
    ['rutasapp_signups_v3', SIGNUPS_KEY],
    ['rutasapp_feed_posts_v3', FEED_POSTS_KEY],
  ];
  pairs.forEach(([oldKey, newKey]) => {
    if (!localStorage.getItem(newKey) && localStorage.getItem(oldKey)) {
      localStorage.setItem(newKey, localStorage.getItem(oldKey));
    }
  });
}

function hideSplash() {
  const splash = document.getElementById('splash');
  const app = document.getElementById('appRoot');
  if (!splash || !app) return;
  splash.classList.add('out');
  app.classList.remove('hidden');
  setTimeout(() => splash.remove(), 500);
}

'''

js = js.replace(
    "const USERS_KEY = 'rutasapp_users_v3';\nconst SESSION_KEY = 'rutasapp_session_v3';\nconst CUSTOM_ROUTES_KEY = 'rutasapp_custom_routes_v3';\nconst SIGNUPS_KEY = 'rutasapp_signups_v3';\nconst FEED_POSTS_KEY = 'rutasapp_feed_posts_v3';\nconst WELCOME_KEY = 'rutasapp_welcome_dismissed_v3';",
    "const USERS_KEY = 'strada_users_v1';\nconst SESSION_KEY = 'strada_session_v1';\nconst CUSTOM_ROUTES_KEY = 'strada_routes_v1';\nconst SIGNUPS_KEY = 'strada_signups_v1';\nconst FEED_POSTS_KEY = 'strada_feed_v1';",
)

js = js.replace("@demo.es", "@strada.es")

js = js.replace(
    """function renderWelcomeBanner() {
  const el = document.getElementById('welcomeBanner');
  if (!el) return;
  el.hidden = !!localStorage.getItem(WELCOME_KEY);
}""",
    "function renderWelcomeBanner() { /* removed */ }",
)

js = js.replace(
    "function renderRoutesPanel() {\n  renderWelcomeBanner();\n  renderExploreExtras();",
    "function renderRoutesPanel() {\n  renderExploreExtras();",
)

js = js.replace(
    "${currentUser ? 'tu ruta' : 'demo'}",
    "${currentUser ? 'Tu ruta activa' : 'Ruta destacada'}",
)

js = js.replace(
    """  document.querySelectorAll('#desktopTabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));""",
    """  document.querySelectorAll('#sidebarNav button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));""",
)

js = js.replace(
    """document.getElementById('clock').textContent = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
setInterval(() => {
  document.getElementById('clock').textContent = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}, 30000);

document.getElementById('dismissWelcome').onclick = () => {
  localStorage.setItem(WELCOME_KEY, '1');
  document.getElementById('welcomeBanner').hidden = true;
};
""",
    "",
)

js = js.replace(
    "restoreSession();\nshowApp();\nshowTab('explore');\nrenderProfile();",
    migration + "\nmigrateLegacyStorage();\nrestoreSession();\nshowApp();\nshowTab('explore');\nrenderProfile();\nhideSplash();",
)

(ROOT / "assets/js/app.js").write_text(js, encoding="utf-8")
print("patched app.js")
