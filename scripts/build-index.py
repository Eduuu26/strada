import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
inner = (ROOT / "assets/inner.html").read_text(encoding="utf-8")

# Fix auth screens with professional layout
inner = inner.replace(
    '<div id="authLogin" class="screen-auth">\n          <div class="app-header"><h2>Iniciar sesión</h2></div>\n          <div class="content">',
    '<div id="authLogin" class="screen-auth">\n          <div class="auth-screen-wrap"><div class="auth-card">',
    1,
)
inner = inner.replace(
    '<div id="authRegister" class="screen-auth">\n          <div class="app-header"><h2>Crear cuenta</h2></div>\n          <div class="content">',
    '<div id="authRegister" class="screen-auth">\n          <div class="auth-screen-wrap"><div class="auth-card">',
    1,
)
# close auth cards - before next screen-auth sibling ends - replace auth footer closing
for marker in ['</div>\n        </div>\n\n        <!-- REGISTER -->', '</div>\n        </div>\n\n        <!-- APP -->']:
    inner = inner.replace(
        '<div class="auth-footer">',
        '<div class="auth-footer">',
    )
# Close auth-card and auth-screen-wrap before REGISTER and APP sections
inner = inner.replace(
    '            <div class="auth-footer"><span style="color:var(--muted)">¿Sin cuenta?</span><button type="button" id="goRegister">Crear cuenta</button></div>\n          </div>\n        </div>',
    '            <div class="auth-footer"><span style="color:var(--muted)">¿Sin cuenta?</span><button type="button" id="goRegister">Crear cuenta</button></div>\n          </div></div>\n        </div>',
    1,
)
inner = inner.replace(
    '            <div class="auth-footer"><span style="color:var(--muted)">¿Ya tienes cuenta?</span><button type="button" id="goLogin">Iniciar sesión</button></div>\n          </div>\n        </div>',
    '            <div class="auth-footer"><span style="color:var(--muted)">¿Ya tienes cuenta?</span><button type="button" id="goLogin">Iniciar sesión</button></div>\n          </div></div>\n        </div>',
    1,
)

# Add brand to auth login
inner = inner.replace(
    '<button class="auth-back" type="button" id="backFromLogin">← Volver</button>\n            <p class="kicker">Acceso opcional</p>',
    '<div class="brand" style="margin-bottom:20px"><div class="brand-mark">S</div><div class="brand-text"><strong>Strada</strong><span>Rutas en coche · España</span></div></div>\n            <button class="auth-back" type="button" id="backFromLogin">← Volver</button>\n            <p class="kicker">Tu cuenta</p>',
    1,
)
inner = inner.replace(
    '<h3 class="hero-title" style="font-size:1.3rem">Entra para apuntarte o crear rutas</h3>\n            <p class="hero-text">Puedes explorar sin cuenta. Solo necesitas sesión para apuntarte eligiendo tu vehículo.</p>',
    '<h3 class="hero-title" style="font-size:1.35rem">Bienvenido de nuevo</h3>\n            <p class="hero-text">Accede para publicar rutas, guardar tu garaje y apuntarte a quedadas.</p>',
    1,
)
inner = inner.replace(
    '<button class="auth-back" type="button" id="backFromRegister">← Volver</button>\n            <p class="kicker">Nueva cuenta</p>\n            <h3 class="hero-title" style="font-size:1.3rem">Únete a la comunidad</h3>\n            <p class="hero-text">Publica rutas y apúntate indicando con qué vehículo vas.</p>',
    '<div class="brand" style="margin-bottom:20px"><div class="brand-mark">S</div><div class="brand-text"><strong>Strada</strong><span>Únete a la comunidad</span></div></div>\n            <button class="auth-back" type="button" id="backFromRegister">← Volver</button>\n            <p class="kicker">Registro</p>\n            <h3 class="hero-title" style="font-size:1.35rem">Crea tu cuenta</h3>\n            <p class="hero-text">Publica rutas con foto, organiza quedadas y conecta con otros conductores.</p>',
    1,
)

# Profile guest copy
inner = inner.replace(
    '<div class="card-title" style="margin-bottom:6px">Cuenta opcional</div>\n                  <p class="card-desc">Explora libremente. Con cuenta puedes guardar tus vehículos, cambiar la foto de perfil y apuntarte a rutas.</p>',
    '<div class="card-title" style="margin-bottom:6px">Tu perfil en Strada</div>\n                  <p class="card-desc">Gestiona tu garaje, foto de perfil y rutas a las que te has apuntado.</p>',
    1,
)

# Add mobile brand to header
inner = inner.replace(
    '<div class="app-header">\n            <h2 id="screenTitle">Explorar</h2>',
    '<div class="app-header">\n            <div class="mobile-brand"><div class="brand-mark">S</div><div class="brand-text"><strong>Strada</strong></div></div>\n            <h2 id="screenTitle">Explorar</h2>',
    1,
)

sidebar = '''
    <aside class="sidebar" id="sidebar">
      <div class="brand">
        <div class="brand-mark">S</div>
        <div class="brand-text"><strong>Strada</strong><span>Rutas en coche · España</span></div>
      </div>
      <nav class="sidebar-nav" id="sidebarNav">
        <button type="button" class="active" data-tab="explore"><span class="nav-icon">📸</span>Explorar</button>
        <button type="button" data-tab="routes"><span class="nav-icon">🗺️</span>Rutas</button>
        <button type="button" data-tab="events"><span class="nav-icon">📅</span>Quedadas</button>
        <button type="button" data-tab="drive"><span class="nav-icon">🚗</span>Conducir</button>
        <button type="button" data-tab="profile"><span class="nav-icon">👤</span>Perfil</button>
      </nav>
      <div class="sidebar-footer">
        <a href="#" onclick="return false">Términos</a> · <a href="#" onclick="return false">Privacidad</a><br>
        © 2026 Strada
      </div>
    </aside>
'''

html = f'''<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#080b10">
  <meta name="description" content="Strada — Comunidad de rutas en coche por España. Descubre rutas, quedadas y navegación en grupo.">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>Strada — Rutas en coche</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%23e85d2c' rx='22' width='100' height='100'/><text x='50' y='68' font-size='52' font-weight='800' fill='white' text-anchor='middle' font-family='system-ui'>S</text></svg>">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="">
  <link rel="stylesheet" href="assets/css/app.css">
</head>
<body>
  <div id="splash" class="splash" aria-hidden="true">
    <div class="splash-logo">Strada</div>
    <div class="splash-tagline">Rutas en coche · España</div>
    <div class="splash-loader" role="progressbar"></div>
  </div>

  <div id="appRoot" class="app-root hidden">
{sidebar}
    <div class="app-main">
{inner}
    </div>
  </div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <script src="assets/js/app.js"></script>
</body>
</html>
'''

(ROOT / "index.html").write_text(html, encoding="utf-8")
print("index.html", len(html))
