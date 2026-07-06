import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import {

  getCookiePolicyUrl,

  getLegalNoticeUrl,

  getPrivacyPolicyUrl,

  getTermsUrl,

  LEGAL_BRAND,

  LEGAL_COMPANY_NAME,

  openLegalUrl,

  resolveLegalUrl,

} from '../lib/legal';

import { colors, fonts, spacing } from '../theme';



type Props = {

  compact?: boolean;

};



function LegalLink({ label, url }: { label: string; url: string }) {

  const resolved = resolveLegalUrl(url);

  if (Platform.OS === 'web') {

    return (

      <a

        href={resolved}

        target="_blank"

        rel="noopener noreferrer"

        style={{

          color: colors.accent,

          fontSize: 12,

          fontWeight: 600,

          fontFamily: fonts.family as string | undefined,

          textDecoration: 'none',

          cursor: 'pointer',

        }}

      >

        {label}

      </a>

    );

  }

  return (

    <Pressable onPress={() => openLegalUrl(url)} hitSlop={8} accessibilityRole="link">

      <Text style={styles.link}>{label}</Text>

    </Pressable>

  );

}



export function LegalFooter({ compact }: Props) {

  const links = [

    { label: 'Privacidad', url: getPrivacyPolicyUrl() },

    { label: 'Términos', url: getTermsUrl() },

    { label: 'Aviso legal', url: getLegalNoticeUrl() },
    { label: 'Cookies', url: getCookiePolicyUrl() },
  ];



  return (

    <View style={[styles.wrap, compact && styles.compact]}>

      <Text style={styles.note}>

        {LEGAL_BRAND} es un servicio de {LEGAL_COMPANY_NAME}. Al usarlo aceptas nuestras condiciones.

        Puedes ejercer tus derechos RGPD desde tu perfil.

      </Text>

      <View style={styles.row}>

        {links.map((link, i) => (

          <View key={link.label} style={styles.linkCell}>

            {i > 0 ? <Text style={styles.sep}>·</Text> : null}

            <LegalLink label={link.label} url={link.url} />

          </View>

        ))}

      </View>

    </View>

  );

}



const font = fonts.family ? { fontFamily: fonts.family } : {};



const styles = StyleSheet.create({

  wrap: { gap: spacing.sm, paddingVertical: spacing.md },

  compact: { paddingVertical: spacing.sm },

  note: { color: colors.textMuted, fontSize: 11, lineHeight: 16, ...font },

  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },

  linkCell: { flexDirection: 'row', alignItems: 'center' },

  sep: { color: colors.textMuted, marginHorizontal: 6, fontSize: 12 },

  link: { color: colors.accent, fontSize: 12, fontWeight: '600', ...font },

});


