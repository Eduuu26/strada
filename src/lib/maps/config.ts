import { getMapboxToken, isMapsConfigured } from '../env';
import type { LngLat } from '../../types';

// ---------------------------------------------------------------------------
// Configuración de mapas y capa de TRÁFICO (Fase 1 · Hito 1.6).
//
// En Fase 1 el tráfico es el del PROVEEDOR (Mapbox), no propio (eso es Fase 2
// con gps_traces). Esta capa es agnóstica del componente de mapa concreto:
// expone proveedor, token, estilos y centro/zoom por defecto para que el visor
// (react-native / web) los consuma sin acoplarse a la librería.
// ---------------------------------------------------------------------------

export type MapProvider = 'mapbox';

/** Estilos base de Mapbox. `navigation*` ya incluyen flujo de tráfico. */
export const MAP_STYLES = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
  /** Estilo con tráfico en tiempo real (día). */
  trafficDay: 'mapbox://styles/mapbox/navigation-day-v1',
  /** Estilo con tráfico en tiempo real (noche). */
  trafficNight: 'mapbox://styles/mapbox/navigation-night-v1',
} as const;

/** Fuente y capa para superponer tráfico sobre un estilo propio si se prefiere. */
export const MAPBOX_TRAFFIC_SOURCE = {
  id: 'mapbox-traffic',
  type: 'vector' as const,
  url: 'mapbox://mapbox.mapbox-traffic-v1',
  sourceLayer: 'traffic',
};

/** Madrid como centro por defecto (coincide con DEFAULT_GEO de geo.ts). */
export const DEFAULT_MAP_CENTER: LngLat = [-3.7038, 40.4168];
export const DEFAULT_MAP_ZOOM = 11;

export type MapConfig = {
  provider: MapProvider;
  token: string | null;
  configured: boolean;
  defaultStyle: string;
  trafficStyle: string;
  center: LngLat;
  zoom: number;
};

export function getMapConfig(): MapConfig {
  return {
    provider: 'mapbox',
    token: getMapboxToken(),
    configured: isMapsConfigured(),
    defaultStyle: MAP_STYLES.streets,
    trafficStyle: MAP_STYLES.trafficDay,
    center: DEFAULT_MAP_CENTER,
    zoom: DEFAULT_MAP_ZOOM,
  };
}

/**
 * Devuelve el estilo a usar según si se quiere tráfico y el esquema de color.
 * El componente de mapa solo necesita esta URL + el token.
 */
export function getMapStyleUrl(opts?: { traffic?: boolean; scheme?: 'day' | 'night' }): string {
  if (!opts?.traffic) return MAP_STYLES.streets;
  return opts.scheme === 'night' ? MAP_STYLES.trafficNight : MAP_STYLES.trafficDay;
}
