import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type StyleProp,
} from 'react-native';
import { colors } from '../theme';

type Props = {
  uri?: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain';
  /** Emoji que se muestra si la imagen falla o no hay URL. */
  fallbackIcon?: string;
};

/**
 * Imagen con estado de carga (spinner) y fallback elegante si falla o no hay
 * URL. Evita los recuadros negros mientras carga una imagen remota.
 */
export function SmartImage({ uri, style, resizeMode = 'cover', fallbackIcon = '🏞️' }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Si cambia la URL, reiniciamos el estado de carga.
  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [uri]);

  const showImage = !!uri && !error;

  return (
    <View style={[styles.wrap, style]}>
      {showImage ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill as StyleProp<ImageStyle>}
          resizeMode={resizeMode}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setError(true);
            setLoading(false);
          }}
        />
      ) : null}

      {loading || !showImage ? (
        <View style={styles.placeholder}>
          {loading && showImage ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Text style={styles.icon}>{fallbackIcon}</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  icon: { fontSize: 40, opacity: 0.5 },
});
