import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAssignments } from '@/hooks/useApi';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { SCHOOL_NAME } from '@/constants/config';
import type { Assignment } from '@/types';

type FilterOption = 'all' | 'pending' | 'submitted' | 'overdue';

/** Stitch: assignments_homework_1 */
export default function AssignmentsListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterOption>('all');
  const { data, isLoading, error, refetch } = useAssignments();

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message="Failed to load assignments" onRetry={() => refetch()} />;

  const pending = data.filter((a) => a.status === 'pending' || a.status === 'overdue');
  const completed = data.filter((a) => a.status === 'submitted');
  const showPending = filter === 'all' || filter === 'pending' || filter === 'overdue';
  const showCompleted = filter === 'all' || filter === 'submitted';

  const filterPending = filter === 'all' ? pending : pending.filter((a) => a.status === filter);
  const filterCompleted = filter === 'all' ? completed : completed;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>ASSIGNMENTS</Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 11 }}>{SCHOOL_NAME}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/assignments/browse')}>
          <MaterialIcons name="search" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
        {(['all', 'pending', 'submitted', 'overdue'] as FilterOption[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, { backgroundColor: filter === f ? theme.colors.primary : theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => setFilter(f)}
          >
            <Text style={{ color: filter === f ? '#fff' : theme.colors.text, fontSize: 12, fontWeight: '600' }}>
              {f === 'all' ? 'All' : f === 'submitted' ? 'Completed' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll}>
        {showPending && filterPending.length > 0 && (
          <Section title="Pending" count={filterPending.length} badgeColor="#fed7aa" badgeTextColor="#ea580c" theme={theme}>
            {filterPending.map((item) => (
              <HomeworkCard key={item.id} item={item} theme={theme} onView={() => router.push(`/assignments/${item.id}`)} onSubmit={() => router.push(`/assignments/${item.id}/submit`)} />
            ))}
          </Section>
        )}
        {showCompleted && filterCompleted.length > 0 && (
          <Section title="Completed" count={filterCompleted.length} theme={theme} subtitle={`SHOWING ${filterCompleted.length} OF ${completed.length}`}>
            {filterCompleted.map((item) => (
              <CompletedCard key={item.id} item={item} theme={theme} onPress={() => router.push(`/assignments/${item.id}`)} />
            ))}
          </Section>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, count, badgeColor, badgeTextColor, subtitle, theme, children }: {
  title: string;
  count: number;
  badgeColor?: string;
  badgeTextColor?: string;
  subtitle?: string;
  theme: ReturnType<typeof useTheme>;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>{title.toUpperCase()}</Text>
        {badgeColor ? (
          <View style={[styles.countBadge, { backgroundColor: badgeColor }]}>
            <Text style={{ color: badgeTextColor, fontSize: 10, fontWeight: '700' }}>{count} TASKS</Text>
          </View>
        ) : (
          <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '700' }}>{subtitle}</Text>
        )}
      </View>
      {children}
    </View>
  );
}

function HomeworkCard({ item, theme, onView, onSubmit }: { item: Assignment; theme: ReturnType<typeof useTheme>; onView: () => void; onSubmit: () => void }) {
  const isUrgent = item.status === 'overdue';
  return (
    <View style={[styles.hwCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }, isUrgent && { borderLeftWidth: 4, borderLeftColor: theme.colors.amber500 }]}>
      <View style={styles.hwCardTop}>
        <View style={[styles.hwIcon, { backgroundColor: `${theme.colors.primary}1a` }]}>
          <MaterialIcons name="menu-book" size={22} color={theme.colors.primary} />
        </View>
        <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '700' }}>{item.subject.toUpperCase()}</Text>
      </View>
      <Text style={[styles.hwTitle, { color: theme.colors.text }]}>{item.title}</Text>
      <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 12 }}>By {item.teacher} • Due {item.dueDate}</Text>
      <View style={[styles.hwActions, { borderTopColor: theme.colors.border }]}>
        <TouchableOpacity style={[styles.hwBtn, { backgroundColor: theme.mode === 'dark' ? theme.colors.slate800 : '#e8f1ed' }]} onPress={onView}>
          <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '700' }}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.hwBtn, { backgroundColor: theme.colors.primary }]} onPress={onSubmit}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{isUrgent ? 'Submit Now' : 'Submit'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CompletedCard({ item, theme, onPress }: { item: Assignment; theme: ReturnType<typeof useTheme>; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.hwCard, styles.completedCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} onPress={onPress}>
      <View style={styles.hwCardTop}>
        <View style={[styles.hwIcon, { backgroundColor: theme.colors.slate100 }]}>
          <MaterialIcons name="history-edu" size={22} color={theme.colors.textMuted} />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: theme.colors.primary, fontSize: 18, fontWeight: '700' }}>A</Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '700' }}>90/100</Text>
        </View>
      </View>
      <Text style={[styles.hwTitle, { color: theme.colors.text }]}>{item.title}</Text>
      <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Submitted • {item.teacher}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  filterScroll: { maxHeight: 48, marginBottom: 8 },
  filterRow: { paddingHorizontal: 16, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  hwCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  completedCard: { opacity: 0.9 },
  hwCardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  hwIcon: { padding: 8, borderRadius: 8 },
  hwTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  hwActions: { flexDirection: 'row', gap: 8, paddingTop: 12, borderTopWidth: 1 },
  hwBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
});
