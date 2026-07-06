import { StyleSheet, TextInput, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function SearchBar({ value, onChangeText, placeholder = 'Buscar…' }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <View style={styles.iconCircle} />
        <View style={styles.iconStem} />
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
    </View>
  );
}

const font = fonts.family ? { fontFamily: fonts.family } : {};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 46,
  },
  icon: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  iconStem: {
    width: 1.5,
    height: 5,
    backgroundColor: colors.textMuted,
    position: 'absolute',
    bottom: 0,
    right: 1,
    transform: [{ rotate: '45deg' }],
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: spacing.sm,
    ...font,
  },
});
