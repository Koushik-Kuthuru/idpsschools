import { useState, useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAssignments } from '@/hooks/useApi';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cardShadow } from '@/constants/shadows';
import { appNavigate } from '@/utils/navigation';
import type { Assignment } from '@/types';

type FilterOption = 'all' | 'pending' | 'submitted' | 'overdue';

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  homework: 'book-outline',
  assignment: 'document-text-outline',
  project: 'people-outline',
  task: 'checkbox-outline',
  assessment: 'school-outline',
  classwork: 'pencil-outline',
};

export default function AssignmentsListScreen() {
  const theme = useTheme();
  const [filter, setFilter] = useState<FilterOption>('all');
  const { data, isLoading, error, refetch, isRefetching } = useAssignments();

  const counts = useMemo(() => {
    const list = data ?? [];
    return {
      pending: list.filter((a) => a.status === 'pending').length,
      overdue: list.filter((a) => a.status === 'overdue').length,
      submitted: list.filter((a) => a.status === 'submitted').length,
      total: list.length,
    };
  }, [data]);

  if (isLoading) return <LoadingScreen />;
  if (error && !data) return <ErrorScreen message="Failed to load projects" onRetry={() => refetch()} />;

  const items = data ?? [];
  const pending = items.filter((a) => a.status === 'pending' || a.status === 'overdue');
  const completed = items.filter((a) => a.status === 'submitted');
  const showPending = filter === 'all' || filter === 'pending' || filter === 'overdue';
  const showCompleted = filter === 'all' || filter === 'submitted';
  const filterPending = filter === 'all' ? pending : pending.filter((a) => a.status === filter);
  const filterCompleted = filter === 'all' ? completed : completed;

  const stats = [
    { label: 'Pending', value: String(counts.pending), color: theme.colors.amber500, icon: 'time-outline' as const },
    { label: 'Overdue', value: String(counts.overdue), color: theme.colors.red500, icon: 'alert-circle-outline' as const },
    { label: 'Done', value: String(counts.submitted), color: theme.colors.primary, icon: 'checkmark-circle-outline' as const },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <ScreenHeader
        title="Projects"
        fallbackRoute="/(tabs)/profile"
        rightAction={
          <TouchableOpacity onPress={() => appNavigate('/assignments/browse')} style={styles.headerAction}>
            <Ionicons name="search-outline" size={22} color={theme.colors.text} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.primary} />}
      >
        <View style={[styles.heroCard, cardShadow]}>
          <Text style={styles.heroEyebrow}>HOMEWORK & PROJECTS</Text>
          <Text style={styles.heroTitle}>{counts.total} projects</Text>
          <Text style={styles.heroSub}>{counts.pending + counts.overdue} need your attention</Text>
        </View>

        <View style={styles.statsRow}>
          {stats.map((s) => (
            <View
              key={s.label}
              style={[styles.statCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            >
              <View style={[styles.statIcon, { backgroundColor: `${s.color}14` }]}>
                <Ionicons name={s.icon} size={14} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <SectionHeader title="Filter" />
        <View style={[styles.filterBar, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          {(['all', 'pending', 'submitted', 'overdue'] as FilterOption[]).map((f) => {
            const active = filter === f;
            const label = f === 'all' ? 'All' : f === 'submitted' ? 'Done' : f.charAt(0).toUpperCase() + f.slice(1);
            return (
              <TouchableOpacity
                key={f}
                activeOpacity={0.75}
                style={[styles.filterTab, active && { backgroundColor: theme.colors.primary }]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterTabText, { color: active ? '#fff' : theme.colors.textSecondary }]} numberOfLines={1}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {showPending && filterPending.length > 0 ? (
          <>
            <SectionHeader title="Pending" />
            {filterPending.map((item) => (
              <AssignmentCard key={item.id} item={item} theme={theme} onView={() => appNavigate(`/assignments/${item.id}`)} onSubmit={() => appNavigate(`/assignments/${item.id}/submit`)} />
            ))}
          </>
        ) : null}

        {showCompleted && filterCompleted.length > 0 ? (
          <>
            <SectionHeader title="Completed" />
            {filterCompleted.map((item) => (
              <AssignmentCard key={item.id} item={item} theme={theme} completed onPress={() => appNavigate(`/assignments/${item.id}`)} />
            ))}
          </>
        ) : null}

        {filterPending.length === 0 && filterCompleted.length === 0 ? (
          <View style={[styles.emptyCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Ionicons name="document-text-outline" size={32} color={theme.colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No projects found</Text>
            <Text style={[styles.emptySub, { color: theme.colors.textSecondary }]}>Try a different filter</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function AssignmentCard({
  item,
  theme,
  completed = false,
  onView,
  onSubmit,
  onPress,
}: {
  item: Assignment;
  theme: ReturnType<typeof useTheme>;
  completed?: boolean;
  onView?: () => void;
  onSubmit?: () => void;
  onPress?: () => void;
}) {
  const isOverdue = item.status === 'overdue';
  const statusColor = completed ? theme.colors.primary : isOverdue ? theme.colors.red500 : theme.colors.amber500;
  const icon = TYPE_ICONS[item.type] ?? 'document-text-outline';

  if (completed) {
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        style={[styles.card, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        onPress={onPress}
      >
        <View style={styles.cardTop}>
          <View style={[styles.cardIcon, { backgroundColor: `${theme.colors.primary}14` }]}>
            <Ionicons name={icon} size={20} color={theme.colors.primary} />
          </View>
          <View style={[styles.statusPill, { backgroundColor: `${theme.colors.primary}14` }]}>
            <Ionicons name="checkmark-circle" size={12} color={theme.colors.primary} />
            <Text style={[styles.statusText, { color: theme.colors.primary }]}>Submitted</Text>
          </View>
        </View>
        <Text style={[styles.cardSubject, { color: theme.colors.textSecondary }]}>{item.subject}</Text>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{item.title}</Text>
        <Text style={[styles.cardMeta, { color: theme.colors.textMuted }]}>{item.teacher} · {item.dueDate}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.card,
        cardShadow,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        isOverdue && { borderLeftWidth: 4, borderLeftColor: theme.colors.red500 },
      ]}
    >
      <View style={styles.cardTop}>
        <View style={[styles.cardIcon, { backgroundColor: `${statusColor}14` }]}>
          <Ionicons name={icon} size={20} color={statusColor} />
        </View>
        <View style={[styles.statusPill, { backgroundColor: `${statusColor}14` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{isOverdue ? 'Overdue' : 'Pending'}</Text>
        </View>
      </View>
      <Text style={[styles.cardSubject, { color: theme.colors.textSecondary }]}>{item.subject} · {item.type}</Text>
      <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{item.title}</Text>
      <Text style={[styles.cardMeta, { color: theme.colors.textMuted }]}>{item.teacher} · Due {item.dueDate}</Text>
      <View style={[styles.cardActions, { borderTopColor: theme.colors.border }]}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.primaryLight }]} onPress={onView}>
          <Text style={[styles.actionBtnText, { color: theme.colors.primary }]}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]} onPress={onSubmit}>
          <Text style={[styles.actionBtnText, { color: '#fff' }]}>{isOverdue ? 'Submit now' : 'Submit'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerAction: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 4 },
  filterBar: { flexDirection: 'row', padding: 4, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  filterTab: { flex: 1, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', borderRadius: 10, minHeight: 40 },
  filterTabText: { fontSize: 12, fontWeight: '700' },
  heroCard: { backgroundColor: '#144835', borderRadius: 16, padding: 20, marginTop: 4, marginBottom: 12 },
  heroEyebrow: { color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 6 },
  heroSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCard: { flex: 1, paddingVertical: 12, paddingHorizontal: 6, borderRadius: 14, borderWidth: 1, alignItems: 'center', minWidth: 0 },
  statIcon: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statValue: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 4 },
  card: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  cardSubject: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  cardMeta: { fontSize: 12, marginTop: 6 },
  cardActions: { flexDirection: 'row', gap: 8, paddingTop: 12, marginTop: 12, borderTopWidth: 1 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
  emptyCard: { alignItems: 'center', padding: 32, borderRadius: 14, borderWidth: 1, marginTop: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptySub: { fontSize: 13, marginTop: 4 },
});
