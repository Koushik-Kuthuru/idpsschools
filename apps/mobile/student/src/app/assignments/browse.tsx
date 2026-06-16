import { useState, useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAssignments } from '@/hooks/useApi';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import type { Assignment } from '@/types';

const FILTERS = ['all', 'pending', 'submitted', 'overdue'] as const;

/** Stitch: assignments_homework_2 */
export default function AssignmentsBrowseScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [search, setSearch] = useState('');
  const { data, isLoading, error, refetch } = useAssignments();

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = filter === 'all' ? data : data.filter((a) => a.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(q) || a.subject.toLowerCase().includes(q));
    }
    return list;
  }, [data, filter, search]);

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message="Failed to load projects" onRetry={() => refetch()} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScreenHeader
        title="ASSIGNMENTS"
        rightAction={
          <MaterialIcons name="search" size={24} color={theme.colors.textSecondary} />
        }
      />
      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={20} color={theme.colors.textMuted} style={styles.searchIcon} />
        <TextInput
          placeholder="Search projects..."
          placeholderTextColor={theme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
          style={[styles.searchInput, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: `${theme.colors.primary}33` }]}
        />
      </View>
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && { backgroundColor: theme.colors.primary }]}
            onPress={() => setFilter(f)}
          >
            <Text style={{ color: filter === f ? '#fff' : theme.colors.textSecondary, fontSize: 12, fontWeight: '600', textTransform: 'capitalize' }}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {filtered.map((item) => (
          <AssignmentBrowseCard key={item.id} item={item} theme={theme} onPress={() => router.push(`/assignments/${item.id}`)} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function AssignmentBrowseCard({ item, theme, onPress }: { item: Assignment; theme: ReturnType<typeof useTheme>; onPress: () => void }) {
  const statusColor = item.status === 'pending' ? theme.colors.amber500 : item.status === 'submitted' ? theme.colors.primary : theme.colors.red500;
  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: `${statusColor}1a` }]}>
        <MaterialIcons name="assignment" size={22} color={statusColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '700' }}>{item.subject.toUpperCase()}</Text>
        <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
        <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{item.teacher} • Due {item.dueDate}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={22} color={theme.colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrap: { paddingHorizontal: 16, marginBottom: 8, position: 'relative' },
  searchIcon: { position: 'absolute', left: 28, top: 14, zIndex: 1 },
  searchInput: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingLeft: 44, paddingRight: 16, marginTop: 4 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.05)' },
  scroll: { padding: 16, paddingBottom: 32 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  iconBox: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', marginVertical: 2 },
});
