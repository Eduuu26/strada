/**
 * E2E smoke tests for Strada web app (static HTML + app.js).
 * Run: node scripts/e2e-web-test.mjs
 * Requires: server on http://127.0.0.1:8787
 */

const BASE = 'http://127.0.0.1:8787';

const results = [];

function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

async function fetchHtml() {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function assert(cond, name, detail) {
  if (cond) pass(name, detail);
  else fail(name, detail);
}

async function main() {
  console.log('Strada web E2E tests\n');

  // 1. Server + HTML structure
  let html;
  try {
    html = await fetchHtml();
    pass('Servidor responde', BASE);
  } catch (e) {
    fail('Servidor responde', String(e.message));
    printSummary();
    process.exit(1);
  }

  assert(html.includes('Strada'), 'Branding Strada en HTML');
  assert(html.includes('data-panel="explore"'), 'Panel Explorar');
  assert(html.includes('data-panel="routes"'), 'Panel Rutas');
  assert(html.includes('data-panel="events"'), 'Panel Quedadas');
  assert(html.includes('data-panel="drive"'), 'Panel Conducir');
  assert(html.includes('data-panel="profile"'), 'Panel Perfil');
  assert(html.includes('createMeetupModal'), 'Modal crear quedada');
  assert(html.includes('createMeetupForm'), 'Formulario crear quedada');
  assert(html.includes('createRouteModal'), 'Modal crear ruta');
  assert(html.includes('joinModal'), 'Modal apuntarse');

  // 2. app.js loads and has key APIs
  const jsRes = await fetch(`${BASE}/assets/js/app.js`);
  assert(jsRes.ok, 'app.js accesible');
  const js = await jsRes.text();
  assert(js.includes('MEETUPS_KEY'), 'Clave meetups en app.js');
  assert(js.includes('getAllMeetups'), 'getAllMeetups definido');
  assert(js.includes('openCreateMeetupModal'), 'openCreateMeetupModal definido');
  assert(js.includes('handleMeetupJoinClick'), 'handleMeetupJoinClick definido');
  assert(js.includes('seedMeetups'), 'seedMeetups definido');
  assert(js.includes('vehicleMode'), 'Soporte vehicleMode');
  assert(js.includes('createMeetupForm'), 'Handler form quedada');

  // 3. CSS loads
  const cssRes = await fetch(`${BASE}/assets/css/app.css`);
  assert(cssRes.ok, 'app.css accesible');

  // 4. Seed data sanity
  const seedRouteMeetings = (js.match(/meetingAt:/g) || []).length;
  assert(seedRouteMeetings >= 8, 'Rutas seed con fechas de quedada', `${seedRouteMeetings} meetingAt`);
  assert(js.includes('filter((r) => r.meetingAt)'), 'seedMeetups derivados de rutas');

  // 5. TypeScript / Expo types (file check)
  const { readFileSync, existsSync } = await import('fs');
  const { join, dirname } = await import('path');
  const root = join(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');

  const typesPath = join(root, 'src', 'types.ts');
  if (existsSync(typesPath)) {
    const types = readFileSync(typesPath, 'utf8');
    assert(types.includes('export type Meetup'), 'Tipo Meetup en Expo');
    assert(types.includes('meetupId'), 'Signup con meetupId');
  }

  const routesCtx = join(root, 'src', 'context', 'RoutesContext.tsx');
  if (existsSync(routesCtx)) {
    const ctx = readFileSync(routesCtx, 'utf8');
    assert(ctx.includes('createMeetup'), 'createMeetup en RoutesContext');
    assert(ctx.includes('joinMeetup'), 'joinMeetup en RoutesContext');
    assert(ctx.includes('buildSeedMeetups'), 'Seed meetups Expo');
  }

  assert(existsSync(join(root, 'app', 'create-meetup.tsx')), 'Pantalla create-meetup Expo');
  assert(existsSync(join(root, 'app', 'meetup', '[id].tsx')), 'Pantalla meetup detail Expo');

  printSummary();
  const failed = results.filter((r) => !r.ok).length;
  process.exit(failed ? 1 : 0);
}

function printSummary() {
  const ok = results.filter((r) => r.ok).length;
  const bad = results.filter((r) => !r.ok).length;
  console.log(`\n--- Resumen: ${ok} OK, ${bad} fallos ---`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
