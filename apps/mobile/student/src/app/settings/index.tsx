import { ScrollView, View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/store';
import { useLogout } from '@/hooks/useLogout';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cardShadow } from '@/constants/shadows';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { notificationsEnabled, privacyAnalytics, setNotifications, setPrivacyAnalytics } = useSettingsStore();
  const { confirmSignOut } = useLogout();

  const menuItems: { icon: keyof typeof Ionicons.glyphMap; label: string; sub: string; route: Href }[] = [
    { icon: 'lock-closed-outline', label: 'Change password', sub: 'Update your login password', route: '/settings/change-password' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <ScreenHeader title="Settings" fallbackRoute="/(tabs)/profile" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, cardShadow]}>
          <View style={styles.heroIcon}>
            <Ionicons name="settings" size={28} color="#144835" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>APP PREFERENCES</Text>
            <Text style={styles.heroTitle}>Your settings</Text>
            <Text style={styles.heroSub}>Manage notifications and account</Text>
          </View>
        </View>

        <SectionHeader title="Preferences" />
        <View style={[styles.groupCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <SettingRow
            icon="notifications-outline"
            label="Notifications"
            sub="Push alerts & reminders"
            theme={theme}
            right={<Switch value={notificationsEnabled} onValueChange={setNotifications} trackColor={{ true: theme.colors.primary }} />}
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <SettingRow
            icon="shield-checkmark-outline"
            label="Privacy & analytics"
            sub="Help improve the app"
            theme={theme}
            right={<Switch value={privacyAnalytics} onValueChange={setPrivacyAnalytics} trackColor={{ true: theme.colors.primary }} />}
          />
        </View>

        <SectionHeader title="Account" />
        <View style={styles.menu}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              activeOpacity={0.75}
              style={[styles.menuItem, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              onPress={() => router.push(item.route)}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${theme.colors.primary}14` }]}>
                <Ionicons name={item.icon} size={18} color={theme.colors.primary} />
              </View>
              <View style={styles.menuCopy}>
                <Text style={[styles.menuLabel, { color: theme.colors.text }]}>{item.label}</Text>
                <Text style={[styles.menuSub, { color: theme.colors.textSecondary }]}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.logoutCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: `${theme.colors.red500}33` }]}
          onPress={() => confirmSignOut()}
          activeOpacity={0.75}
        >
          <View style={[styles.logoutIcon, { backgroundColor: `${theme.colors.red500}14` }]}>
            <Ionicons name="log-out-outline" size={20} color={theme.colors.red500} />
          </View>
          <Text style={[styles.logoutText, { color: theme.colors.red500 }]}>Sign out</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.red500} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  icon,
  label,
  sub,
  theme,
  right,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub?: string;
  theme: ReturnType<typeof useTheme>;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: theme.colors.primaryLight }]}>
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <View style={styles.settingCopy}>
        <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{label}</Text>
        {sub ? <Text style={[styles.settingSub, { color: theme.colors.textSecondary }]}>{sub}</Text> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} /> : null)}
    </View>
  );

  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.75}>{content}</TouchableOpacity>;
  return content;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  heroCard: {
    backgroundColor: '#144835',
    borderRadius: 16,
    padding: 20,
    marginTop: 4,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#a2c144', alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  heroEyebrow: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 4 },
  heroSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 },
  groupCard: { borderRadius: 14, borderWidth: 1, marginBottom: 8, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingCopy: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '600' },
  settingSub: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginHorizontal: 14 },
  menu: { gap: 8, marginBottom: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, gap: 12 },
  menuIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuCopy: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '700' },
  menuSub: { fontSize: 12, marginTop: 2 },
  logoutCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, gap: 12 },
  logoutIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  logoutText: { flex: 1, fontSize: 15, fontWeight: '700' },
});
