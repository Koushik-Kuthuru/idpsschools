import { ScrollView, View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore, useSettingsStore } from '@/store';
import { useLogout } from '@/hooks/useLogout';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { isDark, toggleDark } = useThemeStore();
  const { notificationsEnabled, language, privacyAnalytics, setNotifications, setLanguage, setPrivacyAnalytics } = useSettingsStore();
  const { confirmSignOut } = useLogout();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScreenHeader title="Settings" fallbackRoute="/(tabs)/profile" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <SettingRow
          icon="notifications"
          label="Notifications"
          theme={theme}
          right={<Switch value={notificationsEnabled} onValueChange={setNotifications} trackColor={{ true: theme.colors.primary }} />}
        />
        <SettingRow
          icon="dark-mode"
          label="Dark Mode"
          theme={theme}
          right={<Switch value={isDark} onValueChange={toggleDark} trackColor={{ true: theme.colors.primary }} />}
        />
        <SettingRow
          icon="language"
          label="Language"
          theme={theme}
          subtitle={language}
          onPress={() => {
            const langs = ['English', 'Hindi', 'Spanish'];
            const next = langs[(langs.indexOf(language) + 1) % langs.length];
            setLanguage(next);
          }}
        />
        <SettingRow
          icon="privacy-tip"
          label="Privacy & Analytics"
          theme={theme}
          right={<Switch value={privacyAnalytics} onValueChange={setPrivacyAnalytics} trackColor={{ true: theme.colors.primary }} />}
        />
        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} onPress={() => router.push('/settings/change-password')}>
          <MaterialIcons name="lock" size={22} color={theme.colors.primary} />
          <Text style={[styles.menuLabel, { color: theme.colors.text }]}>Change Password</Text>
          <MaterialIcons name="chevron-right" size={22} color={theme.colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} onPress={() => router.push('/settings/screens')}>
          <MaterialIcons name="apps" size={22} color={theme.colors.primary} />
          <Text style={[styles.menuLabel, { color: theme.colors.text }]}>All App Screens (Stitch)</Text>
          <MaterialIcons name="chevron-right" size={22} color={theme.colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} onPress={() => router.push('/offline')}>
          <MaterialIcons name="wifi-off" size={22} color={theme.colors.amber500} />
          <Text style={[styles.menuLabel, { color: theme.colors.text }]}>Offline Mode</Text>
          <MaterialIcons name="chevron-right" size={22} color={theme.colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, styles.logout]} onPress={() => confirmSignOut()}>
          <MaterialIcons name="logout" size={22} color={theme.colors.red500} />
          <Text style={{ color: theme.colors.red500, fontWeight: '600', flex: 1, marginLeft: 12 }}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ icon, label, subtitle, theme, right, onPress }: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  subtitle?: string;
  theme: ReturnType<typeof useTheme>;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  const content = (
    <View style={[styles.settingRow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <MaterialIcons name={icon} size={22} color={theme.colors.primary} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ color: theme.colors.text, fontWeight: '500' }}>{label}</Text>
        {subtitle && <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>{subtitle}</Text>}
      </View>
      {right ?? (onPress && <MaterialIcons name="chevron-right" size={22} color={theme.colors.textMuted} />)}
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>;
  return content;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16 },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginTop: 8, gap: 12 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  logout: { borderColor: 'transparent', backgroundColor: 'transparent' },
});
