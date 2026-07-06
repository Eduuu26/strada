/**
 * Smoke test de la app Expo web (no la web estática legacy).
 * Uso: npm run dev:web  →  node scripts/e2e-expo-smoke.mjs
 */
const BASE = process.env.STRADA_EXPO_URL ?? 'http://localhost:8082';

const results = [];
const pass = (n, d = '') => {
  results.push({ n, ok: true, d });
  console.log(`✓ ${n}${d ? ` — ${d}` : ''}`);
};
const fail = (n, d = '') => {
  results.push({ n, ok: false, d });
  console.error(`✗ ${n}${d ? ` — ${d}` : ''}`);
};

async function fetchText(path) {
  const res = await fetch(`${BASE}${path}`, { redirect: 'follow' });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

async function main() {
  console.log(`Strada Expo smoke — ${BASE}\n`);

  for (const path of ['/', '/feed', '/drive', '/match', '/login']) {
    try {
      const { ok, status, text } = await fetchText(path);
      if (!ok) {
        fail(`GET ${path}`, `HTTP ${status}`);
        continue;
      }
      const hasRoot = text.includes('id="root"') || text.includes('__expo');
      if (hasRoot || text.length > 200) pass(`GET ${path}`, `${status}`);
      else fail(`GET ${path}`, 'respuesta vacía o inesperada');
    } catch (e) {
      fail(`GET ${path}`, e.message);
    }
  }

  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK`);
  if (failed) {
    console.log('\n¿Está corriendo npm run dev:web?');
    process.exit(1);
  }
}

main();
