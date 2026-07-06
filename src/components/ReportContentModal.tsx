import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ActionButton } from './ActionButton';
import { trackEvent } from '../lib/analytics';
import { submitContentReport } from '../lib/backend/reports';
import type { ContentReportInput } from '../lib/backend/contracts';
import { colors, radius, spacing } from '../theme';

const REASONS: { id: ContentReportInput['reason']; label: string }[] = [
  { id: 'inappropriate_photo', label: 'Foto o contenido inapropiado' },
  { id: 'harassment', label: 'Acoso o insultos' },
  { id: 'spam', label: 'Spam o publicidad' },
  { id: 'fake_profile', label: 'Perfil falso' },
  { id: 'other', label: 'Otro motivo' },
];

type Props = {
  visible: boolean;
  targetEmail: string;
  targetName?: string;
  contextType?: ContentReportInput['contextType'];
  onClose: () => void;
  onSubmitted?: () => void;
};

export function ReportContentModal({
  visible,
  targetEmail,
  targetName,
  contextType = 'profile',
  onClose,
  onSubmitted,
}: Props) {
  const [reason, setReason] = useState<ContentReportInput['reason']>('inappropriate_photo');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    setError('');
    setSending(true);
    const result = await submitContentReport({
      targetEmail,
      targetName,
      reason,
      details: details.trim() || undefined,
      contextType,
    });
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    trackEvent('report_submit', { reason, contextType });
    setDone(true);
    onSubmitted?.();
  }

  function handleClose() {
    setDone(false);
    setDetails('');
    setError('');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.sheet}>
          <Text style={styles.title}>Reportar contenido</Text>
          <Text style={styles.subtitle}>
            {targetName ? `${targetName} (${targetEmail})` : targetEmail}
          </Text>

          {done ? (
            <>
              <Text style={styles.success}>
                Gracias. Hemos recibido tu reporte y lo revisará el equipo de moderación.
              </Text>
              <ActionButton label="Cerrar" onPress={handleClose} />
            </>
          ) : (
            <>
              <Text style={styles.label}>Motivo</Text>
              <View style={styles.reasonList}>
                {REASONS.map((item) => {
                  const active = reason === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setReason(item.id)}
                      style={[styles.reasonChip, active && styles.reasonChipActive]}
                    >
                      <Text style={[styles.reasonText, active && styles.reasonTextActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>Detalles (opcional)</Text>
              <TextInput
                style={styles.input}
                value={details}
                onChangeText={setDetails}
                placeholder="Describe brevemente el problema…"
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={500}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <ActionButton
                label={sending ? 'Enviando…' : 'Enviar reporte'}
                onPress={handleSubmit}
                disabled={sending}
              />
              <ActionButton label="Cancelar" variant="ghost" onPress={handleClose} />
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.sm },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginTop: spacing.xs },
  reasonList: { gap: spacing.xs },
  reasonChip: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  reasonChipActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  reasonText: { color: colors.text, fontSize: 14 },
  reasonTextActive: { fontWeight: '700' },
  input: {
    minHeight: 88,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
  error: { color: colors.danger, fontSize: 14 },
  success: { color: colors.text, fontSize: 14, lineHeight: 22, marginVertical: spacing.md },
});
