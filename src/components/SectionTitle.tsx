import { StyleSheet, Text, type TextStyle } from 'react-native';
import { colors, fonts, spacing } from '../theme';

type Props = {
  children: string;
  style?: TextStyle;
};

/** Título de sección dentro de listas (p. ej. "Disponibles (5)"). */
export function SectionTitle({ children, style }: Props) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    ...(fonts.family ? { fontFamily: fonts.family } : {}),
  },
});
