import { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { unstable_createElement as createElement } from 'react-native-web';
import { getMapConfig, getMapStyleUrl } from '../lib/maps/config';
import type { DrivingRoute, FuelStationNearRoute } from '../types';
import { DriveMapPanel } from './DriveMapPanel';
import { LeafletDriveMap } from './LeafletDriveMap';

type Props = {
  route: DrivingRoute;
  style?: ViewStyle;
  traffic?: boolean;
  extraMarkers?: { latitude: number; longitude: number; label?: string }[];
  fuelStations?: FuelStationNearRoute[];
  cheapestStationId?: number;
};

declare global {
  interface Window {
    mapboxgl?: {
      accessToken: string;
      Map: new (opts: Record<string, unknown>) => MapboxMap;
      NavigationControl: new () => unknown;
      LngLatBounds: new () => { extend: (c: [number, number]) => void };
    };
  }
}

type MapboxMap = {
  on: (ev: string, fn: () => void) => void;
  remove: () => void;
  fitBounds: (b: unknown, o: Record<string, unknown>) => void;
  addControl: (c: unknown, pos?: string) => void;
  addSource: (id: string, src: Record<string, unknown>) => void;
  addLayer: (layer: Record<string, unknown>) => void;
  getSource: (id: string) => { setData: (data: unknown) => void } | undefined;
};

function loadMapboxGl(): Promise<NonNullable<Window['mapboxgl']>> {
  if (Platform.OS !== 'web') return Promise.reject(new Error('not web'));
  if (window.mapboxgl) return Promise.resolve(window.mapboxgl);

  return new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-mapbox-css]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.css';
      link.setAttribute('data-mapbox-css', '1');
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.js';
    script.onload = () => {
      if (window.mapboxgl) resolve(window.mapboxgl);
      else reject(new Error('mapboxgl missing'));
    };
    script.onerror = () => reject(new Error('mapbox script failed'));
    document.head.appendChild(script);
  });
}

function groupMarkersGeoJson(markers: Props['extraMarkers']) {
  return {
    type: 'FeatureCollection',
    features: (markers ?? []).map((m) => ({
      type: 'Feature',
      properties: { label: m.label ?? '' },
      geometry: { type: 'Point', coordinates: [m.longitude, m.latitude] },
    })),
  };
}

function MapboxWebMap({
  route,
  style,
  traffic,
  extraMarkers = [],
  fuelStations = [],
  cheapestStationId,
}: Props) {
  const config = getMapConfig();
  const containerRef = useRef<HTMLElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const loadedRef = useRef(false);
  const gpsKey = useMemo(
    () =>
      extraMarkers
        .map((m) => `${m.latitude.toFixed(5)},${m.longitude.toFixed(5)},${m.label ?? ''}`)
        .join('|'),
    [extraMarkers],
  );

  useEffect(() => {
    if (!config.token) return;

    let cancelled = false;
    loadedRef.current = false;

    void loadMapboxGl().then((mapboxgl) => {
      if (cancelled) return;
      const el = containerRef.current;
      if (!el) return;

      mapRef.current?.remove();
      mapboxgl.accessToken = config.token!;
      const center = route.stops[0]
        ? ([route.stops[0].longitude, route.stops[0].latitude] as [number, number])
        : config.center;

      const map = new mapboxgl.Map({
        container: el,
        style: getMapStyleUrl({ traffic, scheme: 'night' }),
        center,
        zoom: config.zoom,
      });
      mapRef.current = map;

      map.on('load', () => {
        if (cancelled) return;
        const coords = route.stops.map((s) => [s.longitude, s.latitude]);
        if (!coords.length) return;

        map.addSource('route-line', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: coords },
          },
        });
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route-line',
          paint: { 'line-color': '#53b7ff', 'line-width': 5 },
        });

        map.addSource('group-markers', {
          type: 'geojson',
          data: groupMarkersGeoJson(extraMarkers),
        });
        map.addLayer({
          id: 'group-markers-circle',
          type: 'circle',
          source: 'group-markers',
          paint: {
            'circle-radius': 9,
            'circle-color': '#2ecc71',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        });

        const allPoints = [
          ...route.stops.map((s) => ({ latitude: s.latitude, longitude: s.longitude })),
          ...extraMarkers,
        ];
        if (allPoints.length > 1) {
          const b = new mapboxgl.LngLatBounds();
          for (const p of allPoints) b.extend([p.longitude, p.latitude]);
          for (const s of fuelStations) {
            const [lng, lat] = s.geom.coordinates;
            b.extend([lng, lat]);
          }
          map.fitBounds(b, { padding: 48, maxZoom: 12 });
        }

        if (fuelStations.length) {
          map.addSource('fuel-stations', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: fuelStations.map((s) => ({
                type: 'Feature',
                properties: {
                  id: s.id,
                  isCheapest: s.id === cheapestStationId,
                },
                geometry: s.geom,
              })),
            },
          });
          map.addLayer({
            id: 'fuel-stations-circle',
            type: 'circle',
            source: 'fuel-stations',
            paint: {
              'circle-radius': ['case', ['==', ['get', 'isCheapest'], true], 10, 7],
              'circle-color': ['case', ['==', ['get', 'isCheapest'], true], '#e85d2c', '#f4a261'],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
            },
          });
        }

        loadedRef.current = true;
      });

      map.addControl(new mapboxgl.NavigationControl());
    });

    return () => {
      cancelled = true;
      loadedRef.current = false;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [route.id, config.token, traffic, fuelStations.length, cheapestStationId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const source = map.getSource('group-markers');
    if (source) {
      source.setData(groupMarkersGeoJson(extraMarkers));
    }
  }, [gpsKey, extraMarkers]);

  const mapDiv = createElement('div', {
    ref: containerRef,
    style: { width: '100%', height: '100%' },
  });

  return (
    <View style={[styles.map, style]}>
      {mapDiv}
    </View>
  );
}

export function MapboxDriveMap(props: Props) {
  const config = getMapConfig();

  if (Platform.OS === 'web' && config.configured && config.token) {
    return <MapboxWebMap {...props} />;
  }

  if (Platform.OS === 'web') {
    return <LeafletDriveMap {...props} />;
  }

  return (
    <DriveMapPanel
      route={props.route}
      extraMarkers={props.extraMarkers}
      fuelStations={props.fuelStations}
      cheapestStationId={props.cheapestStationId}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    height: 280,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0d1117',
  },
});
