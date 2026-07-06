import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { formatDateTimeLocal, parseUserDateToISO } from '../lib/datetime';
import { colors, radius, spacing } from '../theme';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minimumDate?: Date;
};

function defaultPickerDate(): Date {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 2);
  return d;
}

function parseToDate(value: string): Date {
  const iso = parseUserDateToISO(value);
  if (!iso) return defaultPickerDate();
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? defaultPickerDate() : d;
}

export function DateTimeField({ label, value, onChange, minimumDate }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerDate = useMemo(() => parseToDate(value), [value]);

  function applyDate(date: Date) {
    onChange(formatDateTimeLocal(date));
  }

  function handlePickerChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'dismissed' || !date) return;
    applyDate(date);
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            minHeight: 52,
            padding: '12px 16px',
            borderRadius: radius.md,
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.surface,
            color: colors.text,
            fontSize: 16,
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.pickerBtn} onPress={() => setShowPicker(true)}>
        <Text style={styles.pickerText}>
          {value ? formatDisplay(value) : 'Toca para elegir fecha y hora'}
        </Text>
      </Pressable>
      {Platform.OS === 'ios' && showPicker ? (
        <View style={styles.iosPickerWrap}>
          <DateTimePicker
            value={pickerDate}
            mode="datetime"
            display="spinner"
            minimumDate={minimumDate}
            onChange={handlePickerChange}
          />
          <Pressable onPress={() => setShowPicker(false)} style={styles.doneBtn}>
            <Text style={styles.doneText}>Listo</Text>
          </Pressable>
        </View>
      ) : null}
      {Platform.OS === 'android' && showPicker ? (
        <DateTimePicker
          value={pickerDate}
          mode="datetime"
          minimumDate={minimumDate}
          onChange={handlePickerChange}
        />
      ) : null}
    </View>
  );
}

function formatDisplay(raw: string): string {
  const iso = parseUserDateToISO(raw);
  if (!iso) return raw;
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  pickerBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  pickerText: { color: colors.text, fontSize: 16 },
  iosPickerWrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  doneBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  doneText: { color: colors.accent, fontWeight: '700', fontSize: 16 },
});
