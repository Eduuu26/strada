import { useEffect, useMemo, useRef } from 'react';

import { Platform, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { unstable_createElement as createElement } from 'react-native-web';

import type { DrivingRoute, FuelStationNearRoute } from '../types';

import { initLeafletOnElement, loadLeaflet, type LeafletHandle, type MapMarker } from '../lib/maps/leaflet';

import { colors, radius, spacing } from '../theme';



type Props = {

  route: DrivingRoute;

  style?: ViewStyle;

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



export function LeafletDriveMap({

  route,

  style,

  extraMarkers = [],

  fuelStations = [],

  cheapestStationId,

}: Props) {

  const containerRef = useRef<HTMLElement | null>(null);

  const handleRef = useRef<LeafletHandle | null>(null);

  const gpsKey = useMemo(() => markersKey(extraMarkers), [extraMarkers]);



  useEffect(() => {

    if (Platform.OS !== 'web') return;

    let cancelled = false;



    void loadLeaflet().then(() => {

      if (cancelled) return;

      const el = containerRef.current;

      if (!el) return;

      handleRef.current?.remove();

      handleRef.current = initLeafletOnElement(el, route, {

        extraMarkers,

        fuelStations,

        cheapestStationId,

      });

    });



    return () => {

      cancelled = true;

      handleRef.current?.remove();

      handleRef.current = null;

    };

  }, [route.id, fuelStations.length, cheapestStationId]);



  useEffect(() => {

    handleRef.current?.updateLayers({ extraMarkers, fuelStations, cheapestStationId });

  }, [gpsKey, fuelStations, cheapestStationId, extraMarkers]);



  if (Platform.OS !== 'web') return null;



  const mapDiv = createElement('div', {

    ref: containerRef,

    style: { width: '100%', height: '100%' },

  });



  return (

    <View style={[styles.wrap, style]}>

      {mapDiv}

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


