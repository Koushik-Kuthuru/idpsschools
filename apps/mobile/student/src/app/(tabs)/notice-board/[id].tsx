import { Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAnnouncements } from '@/hooks/useApi';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { NoticeDetailContent } from '@/components/screens/NoticeDetailContent';

export default function NoticeBoardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { data } = useAnnouncements();
  const item = data?.find((a) => a.id === id);

  if (!item) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScreenHeader title="Notice" fallbackRoute="/(tabs)/notice-board" />
        <Text style={{ color: theme.colors.text, textAlign: 'center', marginTop: 40 }}>Notice not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScreenHeader title="Notice" fallbackRoute="/(tabs)/notice-board" />
      <NoticeDetailContent item={item} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
