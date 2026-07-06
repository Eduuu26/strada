import type { DrivingRoute, FuelStationNearRoute } from '../types';

export type MapMarker = { latitude: number; longitude: number; label?: string };

/** HTML autocontenido con Leaflet + Carto (sin API key). Usado en WebView nativo. */
export function buildLeafletMapHtml(
  route: DrivingRoute,
  opts?: {
    fuelStations?: FuelStationNearRoute[];
    cheapestStationId?: number;
    extraMarkers?: MapMarker[];
  },
): string {
  const path = route.stops.map((s) => [s.latitude, s.longitude]);
  const fuel = opts?.fuelStations ?? [];
  const cheapest = opts?.cheapestStationId;
  const extras = opts?.extraMarkers ?? [];

  const payload = JSON.stringify({ path, fuel, cheapest, extras }).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #0d1117; }
    .leaflet-control-attribution { display: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const data = ${payload};
    const path = data.path.map(function(p) { return [p[0], p[1]]; });
    if (!path.length || typeof L === 'undefined') {
      document.body.innerHTML = '<p style="color:#9aa8bc;padding:16px">Sin coordenadas de ruta</p>';
    } else {
      const map = L.map('map', { zoomControl: true, attributionControl: false });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      const line = L.polyline(path, {
        color: '#53b7ff',
        weight: 7,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      const carIcon = L.divIcon({
        className: '',
        html: '<div style="width:18px;height:18px;background:#53b7ff;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.5)"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      L.marker(path[0], { icon: carIcon, zIndexOffset: 1000 }).addTo(map);

      const destIcon = L.divIcon({
        className: '',
        html: '<div style="width:14px;height:14px;background:#e85d2c;border:2px solid #fff;border-radius:50%"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      L.marker(path[path.length - 1], { icon: destIcon }).addTo(map);

      path.forEach(function(pt, i) {
        if (i === 0 || i === path.length - 1) return;
        L.circleMarker(pt, {
          radius: 5,
          color: '#fff',
          weight: 2,
          fillColor: '#243040',
          fillOpacity: 1,
        }).addTo(map);
      });

      var dynamicLayer = L.layerGroup().addTo(map);

      function paintDynamic(next) {
        dynamicLayer.clearLayers();
        (next.extras || []).forEach(function(m) {
          var mk = L.circleMarker([m.latitude, m.longitude], {
            radius: 8,
            color: '#fff',
            weight: 2,
            fillColor: '#2ecc71',
            fillOpacity: 0.9,
          }).addTo(dynamicLayer);
          if (m.label) {
            mk.bindTooltip(m.label, { direction: 'top', offset: [0, -8] });
          }
        });
        (next.fuel || []).forEach(function(s) {
          var c = s.geom.coordinates;
          var isCheap = s.id === next.cheapest;
          L.circleMarker([c[1], c[0]], {
            radius: isCheap ? 10 : 7,
            color: '#fff',
            weight: 2,
            fillColor: isCheap ? '#e85d2c' : '#f4a261',
            fillOpacity: 0.95,
          }).addTo(dynamicLayer);
        });
      }

      window.updateStradaMarkers = function(payload) {
        paintDynamic(payload || {});
      };

      paintDynamic({ extras: data.extras, fuel: data.fuel, cheapest: data.cheapest });

      map.fitBounds(line.getBounds(), { padding: [36, 36] });
      setTimeout(function() { map.invalidateSize(); }, 120);
    }
  </script>
</body>
</html>`;
}

declare global {
  interface Window {
    L?: {
      map: (el: HTMLElement, opts: Record<string, unknown>) => LeafletMap;
      tileLayer: (url: string, opts: Record<string, unknown>) => { addTo: (m: LeafletMap) => void };
      polyline: (pts: [number, number][], opts: Record<string, unknown>) => {
        addTo: (m: LeafletMap) => { getBounds: () => { pad: (n: number) => unknown } };
      };
      divIcon: (opts: Record<string, unknown>) => unknown;
      marker: (pt: [number, number], opts: Record<string, unknown>) => { addTo: (m: LeafletMap) => void };
      circleMarker: (
        pt: [number, number],
        opts: Record<string, unknown>,
      ) => { addTo: (m: LeafletMap) => void };
      layerGroup: () => LeafletLayerGroup;
    };
  }
}

type LeafletMap = {
  remove: () => void;
  fitBounds: (b: unknown, o: Record<string, unknown>) => void;
  invalidateSize: () => void;
};

type LeafletLayerGroup = {
  clearLayers: () => void;
  addTo: (m: LeafletMap) => void;
};

export type LeafletHandle = {
  map: LeafletMap;
  updateLayers: (opts: {
    extraMarkers?: MapMarker[];
    fuelStations?: FuelStationNearRoute[];
    cheapestStationId?: number;
  }) => void;
  remove: () => void;
};

let leafletPromise: Promise<NonNullable<Window['L']>> | null = null;

export function loadLeaflet(): Promise<NonNullable<Window['L']>> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-leaflet-css]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.setAttribute('data-leaflet-css', '1');
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      if (window.L) resolve(window.L);
      else reject(new Error('Leaflet missing'));
    };
    script.onerror = () => reject(new Error('Leaflet script failed'));
    document.head.appendChild(script);
  });

  return leafletPromise;
}

export function initLeafletOnElement(
  el: HTMLElement,
  route: DrivingRoute,
  opts?: {
    fuelStations?: FuelStationNearRoute[];
    cheapestStationId?: number;
    extraMarkers?: MapMarker[];
  },
): LeafletHandle | null {
  const L = window.L;
  if (!L || !route.stops.length) return null;

  const path = route.stops.map((s) => [s.latitude, s.longitude] as [number, number]);
  const map = L.map(el, { zoomControl: true, attributionControl: false });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd',
  }).addTo(map);

  const line = L.polyline(path, {
    color: '#53b7ff',
    weight: 7,
    opacity: 0.95,
    lineCap: 'round',
    lineJoin: 'round',
  }).addTo(map);

  const carIcon = L.divIcon({
    className: '',
    html: '<div style="width:18px;height:18px;background:#53b7ff;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.5)"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
  L.marker(path[0], { icon: carIcon, zIndexOffset: 1000 }).addTo(map);

  const destIcon = L.divIcon({
    className: '',
    html: '<div style="width:14px;height:14px;background:#e85d2c;border:2px solid #fff;border-radius:50%"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
  L.marker(path[path.length - 1], { icon: destIcon }).addTo(map);

  path.forEach((pt, i) => {
    if (i === 0 || i === path.length - 1) return;
    L.circleMarker(pt, {
      radius: 5,
      color: '#fff',
      weight: 2,
      fillColor: '#243040',
      fillOpacity: 1,
    }).addTo(map);
  });

  const dynamicLayer = L.layerGroup().addTo(map);

  const paintDynamic = (next?: {
    extraMarkers?: MapMarker[];
    fuelStations?: FuelStationNearRoute[];
    cheapestStationId?: number;
  }) => {
    dynamicLayer.clearLayers();
    for (const m of next?.extraMarkers ?? []) {
      L.circleMarker([m.latitude, m.longitude], {
        radius: 8,
        color: '#fff',
        weight: 2,
        fillColor: '#2ecc71',
        fillOpacity: 0.9,
      }).addTo(dynamicLayer);
    }
    for (const s of next?.fuelStations ?? []) {
      const [lng, lat] = s.geom.coordinates;
      const isCheap = s.id === next?.cheapestStationId;
      L.circleMarker([lat, lng], {
        radius: isCheap ? 10 : 7,
        color: '#fff',
        weight: 2,
        fillColor: isCheap ? '#e85d2c' : '#f4a261',
        fillOpacity: 0.95,
      }).addTo(dynamicLayer);
    }
  };

  paintDynamic(opts);

  map.fitBounds(line.getBounds(), { padding: [36, 36] });
  setTimeout(() => map.invalidateSize(), 120);

  return {
    map,
    updateLayers: paintDynamic,
    remove: () => map.remove(),
  };
}
