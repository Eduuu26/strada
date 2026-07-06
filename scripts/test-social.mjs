/**
 * Pruebas de seguir / amistad.
 * node scripts/test-social.mjs
 */

const results = [];
const pass = (n, d = '') => {
  results.push({ n, ok: true, d });
  console.log(`✓ ${n}${d ? ` — ${d}` : ''}`);
};
const fail = (n, d = '') => {
  results.push({ n, ok: false, d });
  console.error(`✗ ${n}${d ? ` — ${d}` : ''}`);
};
const assert = (cond, name, detail = '') => {
  if (cond) pass(name, detail);
  else fail(name, detail);
};

function norm(email) {
  return email.trim().toLowerCase();
}

function isFollowing(follows, viewer, target) {
  return follows.some(
    (f) => norm(f.followerEmail) === norm(viewer) && norm(f.followingEmail) === norm(target),
  );
}

function areFriends(requests, a, b) {
  const x = norm(a);
  const y = norm(b);
  return requests.some(
    (r) =>
      r.status === 'accepted' &&
      ((norm(r.fromEmail) === x && norm(r.toEmail) === y) ||
        (norm(r.fromEmail) === y && norm(r.toEmail) === x)),
  );
}

function getFriends(requests, email) {
  const key = norm(email);
  const friends = new Set();
  for (const r of requests) {
    if (r.status !== 'accepted') continue;
    if (norm(r.fromEmail) === key) friends.add(norm(r.toEmail));
    if (norm(r.toEmail) === key) friends.add(norm(r.fromEmail));
  }
  return [...friends];
}

const follows = [
  { followerEmail: 'a@x.es', followingEmail: 'b@x.es', createdAt: '2026-01-01' },
  { followerEmail: 'b@x.es', followingEmail: 'a@x.es', createdAt: '2026-01-02' },
];

const requests = [
  {
    id: '1',
    fromEmail: 'a@x.es',
    fromName: 'A',
    toEmail: 'c@x.es',
    status: 'accepted',
    createdAt: '2026-01-01',
  },
  {
    id: '2',
    fromEmail: 'd@x.es',
    fromName: 'D',
    toEmail: 'a@x.es',
    status: 'pending',
    createdAt: '2026-01-02',
  },
];

assert(isFollowing(follows, 'a@x.es', 'b@x.es'), 'seguir unidireccional');
assert(isFollowing(follows, 'a@x.es', 'b@x.es') && isFollowing(follows, 'b@x.es', 'a@x.es'), 'seguimiento mutuo');
assert(areFriends(requests, 'a@x.es', 'c@x.es'), 'amistad aceptada');
assert(!areFriends(requests, 'a@x.es', 'd@x.es'), 'solicitud pendiente no es amistad');
assert(getFriends(requests, 'a@x.es').includes('c@x.es'), 'lista de amigos');

function cancelOutgoingRequest(requests, fromEmail, toEmail) {
  const from = norm(fromEmail);
  const to = norm(toEmail);
  return requests.filter(
    (r) => !(r.status === 'pending' && norm(r.fromEmail) === from && norm(r.toEmail) === to),
  );
}

const pendingOutgoing = [
  {
    id: '3',
    fromEmail: 'a@x.es',
    fromName: 'A',
    toEmail: 'e@x.es',
    status: 'pending',
    createdAt: '2026-01-03',
  },
];
const afterCancel = cancelOutgoingRequest(pendingOutgoing, 'a@x.es', 'e@x.es');
assert(afterCancel.length === 0, 'cancelar solicitud saliente');
assert(
  cancelOutgoingRequest(pendingOutgoing, 'a@x.es', 'f@x.es').length === 1,
  'cancelar solo la solicitud correcta',
);

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} OK`);
if (failed) process.exit(1);
