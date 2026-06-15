import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useNotifications, useMarkNotificationRead } from '@/hooks/useApi';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import type { NotificationItem } from '@/types';

const TYPE_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  exam: 'school',
  assignment: 'assignment',
  fee: 'payments',
  notice: 'campaign',
};

export default function NotificationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message="Failed to load notifications" onRetry={() => refetch()} />;

  const navigateForNotification = (n: NotificationItem) => {
    if (n.type === 'notice') router.push('/announcements' as '/assignments');
    else if (n.type === 'fee') router.push('/(tabs)/fees');
    else if (n.type === 'exam') router.push('/exams/schedule');
    else router.push('/assignments');
  };

  const handlePress = async (n: NotificationItem) => {
    if (!n.read) {
      await markRead.mutateAsync(n.id);
    }
    navigateForNotification(n);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScreenHeader title="Notifications" fallbackRoute="/(tabs)" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {data.map((n) => (
          <TouchableOpacity
            key={n.id}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                opacity: n.read ? 0.85 : 1,
              },
            ]}
            onPress={() => handlePress(n)}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${theme.colors.primary}1a` }]}>
              <MaterialIcons name={TYPE_ICONS[n.type] ?? 'notifications'} size={22} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: theme.colors.text }]}>{n.title}</Text>
                {!n.read && <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />}
              </View>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13, marginTop: 4 }}>{n.body}</Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 6 }}>{n.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 100 },
  card: { flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12, gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 15, fontWeight: '700', flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
