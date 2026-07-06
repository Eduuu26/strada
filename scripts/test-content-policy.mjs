/**
 * Políticas de contenido: nombre único, catálogo vehículos, profanity, tamaño foto.
 * node scripts/test-content-policy.mjs
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

const BLOCKED = ['puta', 'puto', 'mierda', 'fuck', 'shit'];

function normalizeProfanity(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function containsProfanity(value) {
  const n = normalizeProfanity(value);
  return BLOCKED.some((t) => n.includes(t));
}

function normalizeDisplayNameKey(name) {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function isDisplayNameTaken(name, takenNames) {
  const key = normalizeDisplayNameKey(name);
  return takenNames.some((existing) => normalizeDisplayNameKey(existing) === key);
}

const CAR_CATALOG = {
  Seat: ['Ibiza', 'León', 'Arona'],
  BMW: ['Serie 3', 'M3', 'X3'],
  Ducati: ['Monster', 'Panigale V2'],
};

const MOTO_CATALOG = {
  Yamaha: ['MT-07', 'MT-09'],
  Kawasaki: ['Z900'],
};

function normalizeToken(v) {
  return v
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function findBrand(type, brand) {
  const catalog = type === 'moto' ? MOTO_CATALOG : CAR_CATALOG;
  const needle = normalizeToken(brand);
  return Object.keys(catalog).find((b) => normalizeToken(b) === needle) ?? null;
}

function findModel(brand, model) {
  const models = [...(CAR_CATALOG[brand] ?? []), ...(MOTO_CATALOG[brand] ?? [])];
  const needle = normalizeToken(model);
  return models.find((m) => normalizeToken(m) === needle) ?? null;
}

function estimateDataUrlBytes(dataUrl) {
  const comma = dataUrl.indexOf(',');
  const base64 = comma < 0 ? dataUrl : dataUrl.slice(comma + 1);
  return Math.floor((base64.length * 3) / 4);
}

const MAX_BYTES = 6 * 1024 * 1024;

assert(!containsProfanity('Carlos R.'), 'nombre limpio');
assert(containsProfanity('soy un puto crack'), 'detecta profanity');
assert(isDisplayNameTaken('carlos r.', ['Carlos R.']), 'nombre duplicado case-insensitive');
assert(!isDisplayNameTaken('Nuevo User', ['Carlos R.']), 'nombre libre');
assert(findBrand('coche', 'seat') === 'Seat', 'marca coche válida');
assert(findBrand('coche', 'Ferrari Fake') === null, 'marca inventada');
assert(findModel('BMW', 'm3') === 'M3', 'modelo válido');
assert(findModel('Seat', 'Panda') === null, 'modelo inexistente para marca');
assert(findBrand('moto', 'Kawasaki') === 'Kawasaki', 'marca moto');
assert(estimateDataUrlBytes('data:image/jpeg;base64,' + 'A'.repeat(400)) < MAX_BYTES, 'foto pequeña ok');
assert(estimateDataUrlBytes('data:image/jpeg;base64,' + 'A'.repeat(9_000_000)) > MAX_BYTES, 'foto > 6MB');

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} pruebas OK`);
process.exit(failed ? 1 : 0);
