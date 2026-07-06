/**
 * Prueba feed público (anon), group_locations y chat_reads.
 * node scripts/test-all-features.mjs
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

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
const email = `all_test_${Date.now()}@strada.es`;
const password = 'TestAll2026!Aa';

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
  if (!URL || !ANON) {
    fail('Config', 'Falta .env');
    process.exit(1);
  }

  const anon = createClient(URL, ANON);

  // Feed público sin login
  const feedAnon = await anon.from('feed_posts').select('id').limit(3);
  if (feedAnon.error) fail('feed_posts anon SELECT', feedAnon.error.message);
  else pass('feed_posts anon SELECT', `${feedAnon.data?.length ?? 0} posts`);

  // Auth temporal
  const { data: auth, error: signErr } = await anon.auth.signUp({
    email,
    password,
    options: { data: { name: 'All Test' } },
  });
  let session = auth.session;
  if (!session) {
    const { data: login, error: loginErr } = await anon.auth.signInWithPassword({ email, password });
    if (loginErr) {
      fail('Auth', signErr?.message || loginErr.message);
      process.exit(1);
    }
    session = login.session;
  }
  pass('Auth', email);

  const authed = createClient(URL, ANON);
  await authed.auth.setSession(session);

  // Inscribir en ruta para group_locations RLS (si la migración está aplicada)
  const signupId = `signup_${Date.now()}`;
  const signupRes = await authed.from('signups').upsert({
    id: signupId,
    user_email: email.toLowerCase(),
    created_at: new Date().toISOString(),
    data: {
      id: signupId,
      routeId: 'sierra-madrid',
      userEmail: email.toLowerCase(),
      userName: 'All Test',
      vehicleType: 'car',
      vehicleLabel: 'Test',
      joinedAt: new Date().toISOString(),
    },
  });
  if (signupRes.error) fail('signups UPSERT', signupRes.error.message);
  else pass('signups UPSERT', 'sierra-madrid');

  const glUpsert = await authed.from('group_locations').upsert(
    {
      route_id: 'sierra-madrid',
      user_email: email.toLowerCase(),
      user_name: 'All Test',
      latitude: 40.52,
      longitude: -3.82,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'route_id,user_email' },
  );
  if (glUpsert.error) fail('group_locations UPSERT', glUpsert.error.message);
  else pass('group_locations UPSERT', 'ok');

  const glDup = await authed.from('group_locations').upsert(
    {
      route_id: 'sierra-madrid',
      user_email: email.toLowerCase(),
      user_name: 'All Test 2',
      latitude: 40.53,
      longitude: -3.83,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'route_id,user_email' },
  );
  if (glDup.error) fail('group_locations UPSERT merge', glDup.error.message);
  else pass('group_locations UPSERT merge', 'ok');

  const chatRead = await authed.from('chat_reads').upsert(
    {
      chat_id: 'chat_test_all',
      user_email: email.toLowerCase(),
      read_at: new Date().toISOString(),
    },
    { onConflict: 'chat_id,user_email' },
  );
  if (chatRead.error) {
    if (chatRead.error.message.includes('foreign key')) {
      pass('chat_reads UPSERT', 'RLS ok, FK esperado');
    } else {
      fail('chat_reads UPSERT', chatRead.error.message);
    }
  } else pass('chat_reads UPSERT', 'ok');

  const feedAuth = await authed.from('feed_posts').select('id').limit(1);
  if (feedAuth.error) fail('feed_posts auth SELECT', feedAuth.error.message);
  else pass('feed_posts auth SELECT', 'ok');

  // Cleanup
  await authed.from('group_locations').delete().eq('route_id', 'sierra-madrid').eq('user_email', email.toLowerCase());
  await authed.from('signups').delete().eq('id', signupId);

  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
