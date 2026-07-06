/** Palabras no permitidas en nombres públicos y datos de vehículo. */
const BLOCKED_TERMS = [
  'puta',
  'puto',
  'mierda',
  'cabron',
  'cabrón',
  'gilipollas',
  'imbecil',
  'imbécil',
  'idiota',
  'pendejo',
  'maricon',
  'maricón',
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'cunt',
  'nazi',
  'hitler',
  'porno',
  'porn',
  'sexo',
  'xxx',
];

function normalizeForProfanity(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export function containsProfanity(value: string): boolean {
  const normalized = normalizeForProfanity(value);
  if (!normalized) return false;
  return BLOCKED_TERMS.some((term) => {
    const t = normalizeForProfanity(term);
    return t.length >= 3 && normalized.includes(t);
  });
}

export function assertCleanText(value: string, fieldLabel = 'Este campo'): void {
  if (containsProfanity(value)) {
    throw new Error(`${fieldLabel} contiene palabras no permitidas.`);
  }
}
