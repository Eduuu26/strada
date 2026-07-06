import type { VehicleType } from '../types';
import { assertCleanText } from '../lib/security/profanity';

type Catalog = Record<string, readonly string[]>;

export const CAR_CATALOG: Catalog = {
  Seat: ['Ibiza', 'León', 'Arona', 'Ateca', 'Tarraco', 'Cupra Formentor'],
  Volkswagen: ['Golf', 'Polo', 'Tiguan', 'Passat', 'T-Roc', 'ID.3', 'ID.4'],
  BMW: ['Serie 1', 'Serie 2', 'Serie 3', 'Serie 4', 'Serie 5', 'X1', 'X3', 'X5', 'M3', 'M4', 'Z4'],
  'Mercedes-Benz': ['Clase A', 'Clase B', 'Clase C', 'Clase E', 'GLA', 'GLC', 'GLE', 'AMG GT'],
  Audi: ['A1', 'A3', 'A4', 'A5', 'A6', 'Q2', 'Q3', 'Q5', 'Q7', 'TT', 'e-tron'],
  Porsche: ['911', '911 Carrera', '718', 'Cayenne', 'Macan', 'Panamera', 'Taycan'],
  Mini: ['Cooper', 'Cooper S', 'Countryman', 'Clubman'],
  Toyota: ['Aygo', 'Yaris', 'Corolla', 'C-HR', 'RAV4', 'Prius', 'GR86'],
  Ford: ['Fiesta', 'Focus', 'Puma', 'Kuga', 'Mustang', 'Ranger'],
  Renault: ['Clio', 'Megane', 'Captur', 'Arkana', 'Austral', 'Zoe'],
  Peugeot: ['208', '2008', '308', '3008', '508', 'Rifter'],
  Citroën: ['C3', 'C4', 'C5 Aircross', 'Berlingo'],
  Hyundai: ['i10', 'i20', 'i30', 'Tucson', 'Kona', 'Ioniq 5'],
  Kia: ['Picanto', 'Rio', 'Ceed', 'Sportage', 'Niro', 'EV6'],
  Fiat: ['500', 'Panda', 'Tipo', '500X'],
  'Alfa Romeo': ['Giulia', 'Stelvio', 'Tonale'],
  Jeep: ['Renegade', 'Compass', 'Wrangler', 'Avenger'],
  'Land Rover': ['Defender', 'Discovery', 'Range Rover Evoque', 'Range Rover Sport'],
  Volvo: ['XC40', 'XC60', 'XC90', 'V60', 'S60'],
  Nissan: ['Micra', 'Juke', 'Qashqai', 'Leaf', 'X-Trail'],
  Mazda: ['MX-5', 'Mazda2', 'Mazda3', 'CX-30', 'CX-5'],
  Honda: ['Civic', 'Jazz', 'HR-V', 'CR-V'],
  Skoda: ['Fabia', 'Octavia', 'Kamiq', 'Karoq', 'Kodiaq'],
  Cupra: ['Formentor', 'Born', 'Leon', 'Ateca'],
  Tesla: ['Model 3', 'Model Y', 'Model S', 'Model X'],
};

export const MOTO_CATALOG: Catalog = {
  Yamaha: ['MT-03', 'MT-07', 'MT-09', 'MT-10', 'YZF-R1', 'YZF-R3', 'Tracer 7', 'Tracer 9', 'XSR700', 'Ténéré 700'],
  Honda: ['CB500F', 'CB650R', 'CBR500R', 'CBR650R', 'Africa Twin', 'NC750X', 'Forza 350', 'PCX 125'],
  Kawasaki: ['Z400', 'Z650', 'Z900', 'Ninja 400', 'Ninja 650', 'Versys 650', 'Vulcan S'],
  Suzuki: ['GSX-S750', 'GSX-R600', 'GSX-R1000', 'V-Strom 650', 'Hayabusa', 'SV650'],
  BMW: ['R1250GS', 'F850GS', 'S1000RR', 'G310R', 'C400X'],
  Ducati: ['Monster', 'Panigale V2', 'Panigale V4', 'Multistrada', 'Scrambler', 'Diavel'],
  KTM: ['125 Duke', '390 Duke', '790 Duke', '1290 Super Duke', '390 Adventure', '890 Adventure'],
  Triumph: ['Street Triple', 'Speed Triple', 'Tiger 900', 'Bonneville', 'Rocket 3'],
  'Harley-Davidson': ['Sportster', 'Street Bob', 'Fat Boy', 'Pan America'],
  Aprilia: ['RSV4', 'Tuono', 'RS 660', 'Tuareg'],
  Husqvarna: ['Svartpilen 401', 'Vitpilen 401', 'Norden 901'],
  Piaggio: ['Beverly', 'Medley', 'Liberty'],
  Vespa: ['Primavera', 'GTS', 'Sprint'],
  Benelli: ['TRK 502', 'Leoncino', 'BN 125'],
  'Royal Enfield': ['Interceptor 650', 'Continental GT', 'Himalayan'],
};

function normalizeCatalogToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function catalogForType(type: VehicleType): Catalog {
  return type === 'moto' ? MOTO_CATALOG : CAR_CATALOG;
}

export function findCatalogBrand(type: VehicleType, brandInput: string): string | null {
  const catalog = catalogForType(type);
  const needle = normalizeCatalogToken(brandInput);
  if (!needle) return null;
  for (const brand of Object.keys(catalog)) {
    if (normalizeCatalogToken(brand) === needle) return brand;
  }
  return null;
}

export function findCatalogModel(brand: string, modelInput: string): string | null {
  const needle = normalizeCatalogToken(modelInput);
  if (!needle) return null;
  const models = [...(CAR_CATALOG[brand] ?? []), ...(MOTO_CATALOG[brand] ?? [])];
  for (const model of models) {
    if (normalizeCatalogToken(model) === needle) return model;
  }
  return null;
}

export function validateVehicleBrandModel(
  type: VehicleType,
  brandInput: string,
  modelInput: string,
): string | null {
  const brand = brandInput.trim();
  const model = modelInput.trim();
  if (!brand) return 'Indica la marca del vehículo.';
  if (!model) return 'Indica el modelo.';
  try {
    assertCleanText(brand, 'La marca');
    assertCleanText(model, 'El modelo');
  } catch (e) {
    return e instanceof Error ? e.message : 'Texto no permitido.';
  }

  const canonicalBrand = findCatalogBrand(type, brand);
  if (!canonicalBrand) {
    const kind = type === 'moto' ? 'moto' : 'coche';
    return `Marca no reconocida. Elige una marca real de ${kind} del listado (ej. Seat, Yamaha, BMW…).`;
  }

  const canonicalModel = findCatalogModel(canonicalBrand, model);
  if (!canonicalModel) {
    return `Modelo no reconocido para ${canonicalBrand}. Revisa la ortografía o elige un modelo existente.`;
  }

  return null;
}

export function getCatalogBrands(type: VehicleType): string[] {
  return Object.keys(catalogForType(type)).sort((a, b) => a.localeCompare(b, 'es'));
}

export function getCatalogModels(type: VehicleType, brand: string): string[] {
  const canonical = findCatalogBrand(type, brand);
  if (!canonical) return [];
  return [...(catalogForType(type)[canonical] ?? [])];
}
