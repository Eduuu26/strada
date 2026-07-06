import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { buildLeafletMapHtml, type MapMarker } from '../lib/maps/leaflet';
import type { DrivingRoute, FuelStationNearRoute } from '../types';
import { colors, radius, spacing } from '../theme';

type Props = {
  route: DrivingRoute;
  extraMarkers?: MapMarker[];
  fuelStations?: FuelStationNearRoute[];
  cheapestStationId?: number;
};

function NavOverlay({ route }: { route: DrivingRoute }) {
  const instruction = route.navInstruction ?? 'Sigue la ruta marcada';
  const nextKm = route.navNextKm != null ? `En ${route.navNextKm} km` : '—';

  return (
    <>
      <View style={styles.navBanner} pointerEvents="none">
        <Text style={styles.turnIcon}>➡️</Text>
        <View style={styles.navText}>
          <Text style={styles.instruction}>{instruction}</Text>
          <Text style={styles.distance}>{nextKm}</Text>
        </View>
      </View>
      <View style={styles.bottomBar} pointerEvents="none">
        <Text style={styles.bottomText}>{route.durationMin} min</Text>
        <Text style={styles.bottomText}>{route.distanceKm} km</Text>
      </View>
    </>
  );
}

function markersKey(markers: MapMarker[]): string {
  return markers
    .map((m) => `${m.latitude.toFixed(5)},${m.longitude.toFixed(5)},${m.label ?? ''}`)
    .join('|');
}

export function DriveMapPanel({
  route,
  extraMarkers = [],
  fuelStations = [],
  cheapestStationId,
}: Props) {
  const webRef = useRef<WebView>(null);
  const [mapReady, setMapReady] = useState(false);

  const html = useMemo(
    () =>
      buildLeafletMapHtml(route, {
        extraMarkers: [],
        fuelStations,
        cheapestStationId,
      }),
    [route.id, fuelStations, cheapestStationId],
  );

  const gpsKey = useMemo(() => markersKey(extraMarkers), [extraMarkers]);

  const injectPayload = useMemo(
    () =>
      JSON.stringify({
        extras: extraMarkers,
        fuel: fuelStations,
        cheapest: cheapestStationId,
      }).replace(/</g, '\\u003c'),
    [gpsKey, extraMarkers, fuelStations, cheapestStationId],
  );

  useEffect(() => {
    setMapReady(false);
  }, [route.id]);

  useEffect(() => {
    if (!mapReady) return;
    webRef.current?.injectJavaScript(
      `window.updateStradaMarkers && window.updateStradaMarkers(${injectPayload}); true;`,
    );
  }, [injectPayload, mapReady]);

  return (
    <View style={styles.wrap}>
      <WebView
        ref={webRef}
        source={{ html }}
        style={styles.map}
        originWhitelist={['*']}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        allowsInlineMediaPlayback
        androidLayerType="hardware"
        onLoadEnd={() => setMapReady(true)}
      />
      <NavOverlay route={route} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 280,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: '#0d1117',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  map: {
    flex: 1,
    backgroundColor: '#0d1117',
    ...(Platform.OS === 'web' ? { minHeight: 280 } : {}),
  },
  navBanner: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(13,17,23,0.92)',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 500,
  },
  turnIcon: { fontSize: 22 },
  navText: { flex: 1, gap: 2 },
  instruction: { color: colors.text, fontWeight: '700', fontSize: 14 },
  distance: { color: colors.textMuted, fontSize: 12 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.75)',
    zIndex: 500,
  },
  bottomText: { color: colors.text, fontWeight: '700', fontSize: 13 },
});
