import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useCourseDetail } from '@/hooks/useApi';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { cardShadow } from '@/constants/shadows';
import type { CourseResource } from '@/types';

const RESOURCE_ICONS: Record<CourseResource['type'], keyof typeof Ionicons.glyphMap> = {
  book: 'book-outline',
  pdf: 'document-text-outline',
  link: 'link-outline',
};

export default function CourseResourcesScreen() {
  const theme = useTheme();
  const { courseId, subject } = useLocalSearchParams<{ courseId: string; subject?: string }>();
  const id = courseId ?? '';
  const { data, isLoading, error, refetch } = useCourseDetail(id, subject);

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message="Failed to load resources" onRetry={() => refetch()} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <ScreenHeader title="Resources" fallbackRoute={`/timetable/${id}`} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.eyebrow, { color: theme.colors.textSecondary }]}>{data.code}</Text>
        <Text style={[styles.title, { color: theme.colors.text }]}>{data.subject}</Text>

        {data.resources.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No resources added yet.</Text>
          </View>
        ) : (
          data.resources.map((resource) => (
            <View
              key={resource.id}
              style={[styles.resourceCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            >
              <View style={[styles.resourceIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name={RESOURCE_ICONS[resource.type]} size={22} color={theme.colors.primary} />
              </View>
              <View style={styles.resourceCopy}>
                <Text style={[styles.resourceTitle, { color: theme.colors.text }]}>{resource.title}</Text>
                {resource.author ? (
                  <Text style={[styles.resourceMeta, { color: theme.colors.textSecondary }]}>{resource.author}</Text>
                ) : null}
                {resource.subtitle ? (
                  <Text style={[styles.resourceMeta, { color: theme.colors.textMuted }]}>{resource.subtitle}</Text>
                ) : null}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4, marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 14 },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  resourceIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  resourceCopy: { flex: 1 },
  resourceTitle: { fontSize: 15, fontWeight: '700', lineHeight: 21 },
  resourceMeta: { fontSize: 12, marginTop: 4, lineHeight: 17 },
});
