import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useCarMatch } from '../../src/context/CarMatchContext';
import { useChats } from '../../src/context/ChatsContext';
import { useSocial } from '../../src/context/SocialContext';
import { useCookieConsentInset } from '../../src/context/CookieConsentContext';
import { brand, colors, fonts, layout } from '../../src/theme';

type IconName = ComponentProps<typeof Feather>['name'];

const TAB_ICONS: Record<string, IconName> = {
  feed: 'compass',
  index: 'map',
  events: 'calendar',
  clubs: 'flag',
  communities: 'globe',
  chats: 'message-circle',
  match: 'heart',
  drive: 'navigation',
  profile: 'user',
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icon = TAB_ICONS[name] ?? 'circle';
  return (
    <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
      <Feather name={icon} size={20} color={focused ? colors.accent : colors.textMuted} />
    </View>
  );
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive, fonts.family ? { fontFamily: fonts.family } : null]}>
      {label}
    </Text>
  );
}

function HeaderTitle() {
  return (
    <View style={styles.headerBrand}>
      <View style={styles.headerMark}>
        <View style={styles.headerMarkInner} />
      </View>
      <View>
        <Text style={[styles.headerName, fonts.family ? { fontFamily: fonts.family } : null]}>{brand.name}</Text>
        <Text style={styles.headerTag}>{brand.tagline}</Text>
      </View>
    </View>
  );
}

const TAB_TITLES: Record<string, string> = {
  feed: 'Explorar',
  index: 'Rutas',
  events: 'Quedadas',
  clubs: 'Clubes',
  communities: 'Comunidades',
  chats: 'Chats',
  match: 'Match',
  drive: 'Conducir',
  profile: 'Perfil',
};

export default function TabsLayout() {
  const { user } = useAuth();
  const { getUnreadCount } = useChats();
  const { unreadCount: carLikeUnread } = useCarMatch();
  const { getPendingRequestCount } = useSocial();
  const cookieInset = useCookieConsentInset();
  const unreadChats = user ? getUnreadCount(user.email) : 0;
  const pendingFriends = user ? getPendingRequestCount() : 0;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerTitle: () => <HeaderTitle />,
        headerStyle: styles.header,
        headerShadowVisible: false,
        tabBarStyle: [
          styles.tabBar,
          cookieInset > 0 ? { paddingBottom: (Platform.OS === 'ios' ? 10 : 6) + cookieInset } : null,
        ],
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarLabel: ({ focused }) => (
          <TabLabel label={TAB_TITLES[route.name] ?? route.name} focused={focused} />
        ),
      })}
    >
      <Tabs.Screen name="feed" options={{ title: 'Explorar' }} />
      <Tabs.Screen name="index" options={{ title: 'Rutas' }} />
      <Tabs.Screen name="events" options={{ title: 'Quedadas' }} />
      <Tabs.Screen name="clubs" options={{ title: 'Clubes' }} />
      <Tabs.Screen name="communities" options={{ title: 'Comunidades' }} />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarBadge: unreadChats > 0 ? unreadChats : undefined,
          tabBarBadgeStyle: styles.badge,
        }}
      />
      <Tabs.Screen
        name="match"
        options={{
          title: 'Match',
          tabBarBadge: carLikeUnread > 0 ? carLikeUnread : undefined,
          tabBarBadgeStyle: styles.badge,
        }}
      />
      <Tabs.Screen name="drive" options={{ title: 'Conducir' }} />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarBadge: pendingFriends > 0 ? pendingFriends : undefined,
          tabBarBadgeStyle: styles.badge,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.headerLine,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerMark: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMarkInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.9)',
    transform: [{ rotate: '45deg' }],
  },
  headerName: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: -0.3,
    lineHeight: 18,
  },
  headerTag: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  tabBar: {
    backgroundColor: colors.tabBar,
    borderTopColor: colors.headerLine,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 78 : 68,
    paddingBottom: Platform.OS === 'ios' ? 10 : 6,
    paddingTop: 6,
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  tabIconWrap: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  tabIconWrapActive: {
    backgroundColor: colors.accentSoft,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 2,
  },
  tabLabelActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: colors.accent,
    color: '#fff',
    fontSize: 9,
    minWidth: 16,
    height: 16,
  },
});
