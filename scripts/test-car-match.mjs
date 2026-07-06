/**
 * Pruebas de lógica del módulo Match (sin React).
 * node scripts/test-car-match.mjs
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

function cardKey(ownerEmail, vehicleId) {
  return `${ownerEmail.toLowerCase()}|${vehicleId}`;
}

function buildCarMatchCard(user) {
  return (user.vehicles ?? [])
    .filter((v) => v.photoUrl || v.brand)
    .map((vehicle) => ({
      id: cardKey(user.email, vehicle.id),
      ownerEmail: user.email,
      ownerName: user.name,
      vehicle,
    }));
}

function filterDeck(cards, viewerEmail, swipes) {
  const viewer = viewerEmail.toLowerCase();
  return cards.filter((c) => {
    if (c.ownerEmail.toLowerCase() === viewer) return false;
    if (swipes[c.id]) return false;
    return true;
  });
}

function hasExistingLike(likes, fromEmail, toEmail, vehicleId) {
  const from = fromEmail.toLowerCase();
  const to = toEmail.toLowerCase();
  return likes.some(
    (l) =>
      l.fromEmail.toLowerCase() === from &&
      l.toEmail.toLowerCase() === to &&
      l.vehicleId === vehicleId,
  );
}

function shuffleDeck(cards) {
  const next = [...cards];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

const laura = {
  id: 'laura@strada.es|v1',
  ownerEmail: 'laura@strada.es',
  ownerName: 'Laura M.',
  vehicle: { id: 'v1', brand: 'Porsche', model: '911', photoUrl: 'x' },
};

const carlos = {
  id: 'carlos@strada.es|v1',
  ownerEmail: 'carlos@strada.es',
  ownerName: 'Carlos R.',
  vehicle: { id: 'v1', brand: 'Ducati', model: 'Monster', photoUrl: 'x' },
};

assert(
  buildCarMatchCard({
    email: 'test@strada.es',
    name: 'Test',
    vehicles: [
      { id: 'v1', brand: 'BMW', model: 'M3', photoUrl: 'a' },
      { id: 'v2', brand: '', model: '', photoUrl: '' },
    ],
  }).length === 1,
  'buildCarMatchCard filtra sin foto/marca',
);

assert(
  filterDeck([laura, carlos], 'laura@strada.es', {}).length === 1,
  'filterDeck excluye propios vehículos',
  'solo Carlos',
);

assert(
  filterDeck([laura, carlos], 'viewer@strada.es', { [laura.id]: 'pass' }).length === 1,
  'filterDeck excluye ya vistos',
  'Laura pasada',
);

assert(
  hasExistingLike(
    [{ fromEmail: 'a@x.es', toEmail: 'b@x.es', vehicleId: 'v1' }],
    'A@X.ES',
    'b@x.es',
    'v1',
  ),
  'hasExistingLike detecta duplicados',
);

const shuffled = shuffleDeck([laura, carlos, { ...laura, id: 'x' }]);
assert(shuffled.length === 3, 'shuffleDeck conserva tamaño');

assert(cardKey('User@Mail.es', 'v9') === 'user@mail.es|v9', 'cardKey normaliza email');

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} OK`);
if (failed) process.exit(1);
