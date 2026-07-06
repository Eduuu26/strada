/**
 * Prueba group_locations con registro temporal.
 * node scripts/test-group-location.mjs
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');
for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq < 0) continue;
  const key = trimmed.slice(0, eq).trim();
  const val = trimmed.slice(eq + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const email = `gps_test_${Date.now()}@strada.es`;
const password = 'TestGps2026!Aa';

const results = [];
const pass = (n, d = '') => {
  results.push({ n, ok: true, d });
  console.log(`✓ ${n}${d ? ` — ${d}` : ''}`);
};
const fail = (n, d = '') => {
  results.push({ n, ok: false, d });
  console.error(`✗ ${n}${d ? ` — ${d}` : ''}`);
};

async function main() {
  const signup = await fetch(`${URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, data: { name: 'GPS Test' } }),
  });
  let auth = await signup.json();
  if (!signup.ok && !auth.access_token) {
    const login = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    auth = await login.json();
    if (!login.ok) {
      fail('Auth', JSON.stringify(auth).slice(0, 200));
      process.exit(1);
    }
  }
  pass('Auth', email);

  const token = auth.access_token;
  const h = {
    apikey: ANON,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates',
  };

  const table = await fetch(`${URL}/rest/v1/group_locations?select=route_id&limit=1`, { headers: h });
  if (table.ok) pass('group_locations SELECT', String(table.status));
  else fail('group_locations SELECT', await table.text());

  const upsert = await fetch(`${URL}/rest/v1/group_locations`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({
      route_id: 'sierra-madrid',
      user_email: email.toLowerCase(),
      user_name: 'GPS Test',
      latitude: 40.5186,
      longitude: -3.8267,
      updated_at: new Date().toISOString(),
    }),
  });
  if (upsert.ok) pass('group_locations UPSERT', 'ok');
  else fail('group_locations UPSERT', await upsert.text());

  const read = await fetch(
    `${URL}/rest/v1/group_locations?route_id=eq.sierra-madrid&user_email=eq.${encodeURIComponent(email.toLowerCase())}&select=user_name,latitude,longitude`,
    { headers: h },
  );
  const rows = await read.json();
  if (read.ok && rows.length === 1) pass('group_locations READ', JSON.stringify(rows[0]));
  else fail('group_locations READ', JSON.stringify(rows));

  const del = await fetch(
    `${URL}/rest/v1/group_locations?route_id=eq.sierra-madrid&user_email=eq.${encodeURIComponent(email.toLowerCase())}`,
    { method: 'DELETE', headers: h },
  );
  if (del.ok) pass('group_locations DELETE', 'ok');
  else fail('group_locations DELETE', await del.text());

  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
