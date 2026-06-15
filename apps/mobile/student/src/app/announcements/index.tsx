import { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAnnouncements } from '@/hooks/useApi';
import { LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import type { AnnouncementDetail } from '@/types';

const CATEGORY_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  important: 'priority-high',
  holiday: 'event-busy',
  events: 'celebration',
  general: 'info',
};

export default function AnnouncementsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useAnnouncements();
  const [query, setQuery] = useState('');

  const grouped = useMemo(() => {
    if (!data) return [];
    const filtered = data.filter(
      (a) =>
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.description.toLowerCase().includes(query.toLowerCase())
    );
    const categories = ['important', 'holiday', 'events', 'general'] as const;
    return categories
      .map((cat) => ({
        category: cat,
        label: cat === 'important' ? 'Important' : cat === 'holiday' ? 'Holiday Notice' : cat === 'events' ? 'Events' : 'General',
        items: filtered.filter((a) => a.category === cat),
      }))
      .filter((g) => g.items.length > 0);
  }, [data, query]);

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message="Failed to load announcements" onRetry={() => refetch()} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>ANNOUNCEMENTS</Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.searchWrap}>
        <View style={[styles.searchBox, { backgroundColor: theme.colors.input, borderColor: theme.colors.border }]}>
          <MaterialIcons name="search" size={22} color={theme.colors.primary} />
          <TextInput
            placeholder="Search notices"
            placeholderTextColor={theme.colors.textMuted}
            value={query}
            onChangeText={setQuery}
            style={[styles.searchInput, { color: theme.colors.text }]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {grouped.map((section) => (
          <View key={section.category} style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name={CATEGORY_ICONS[section.category] ?? 'info'} size={20} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{section.label.toUpperCase()}</Text>
            </View>
            {section.items.map((item) => (
              <AnnouncementItemCard key={item.id} item={item} theme={theme} onPress={() => router.push({ pathname: '/announcements/[id]', params: { id: item.id } })} />
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function AnnouncementItemCard({ item, theme, onPress }: { item: AnnouncementDetail; theme: ReturnType<typeof useTheme>; onPress: () => void }) {
  const isImportant = item.category === 'important';
  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          borderLeftWidth: item.category === 'holiday' ? 4 : 1,
          borderLeftColor: item.category === 'holiday' ? theme.colors.primary : theme.colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {item.imageUrl && isImportant && (
        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="cover" />
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{item.title}</Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 13, marginTop: 4 }}>{item.postedAt}</Text>
          </View>
          {item.priority && (
            <View style={[styles.badge, { backgroundColor: `${theme.colors.primary}1a` }]}>
              <Text style={{ color: theme.colors.primary, fontSize: 10, fontWeight: '700' }}>{item.priority}</Text>
            </View>
          )}
        </View>
        {item.attachments && item.attachments > 0 && (
          <View style={[styles.attachRow, { borderTopColor: theme.colors.border }]}>
            <MaterialIcons name="attachment" size={16} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '600' }}>{item.attachments} attachment(s)</Text>
            <TouchableOpacity style={[styles.viewBtn, { backgroundColor: theme.colors.primary }]} onPress={onPress}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>View</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: 1 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
  searchWrap: { padding: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, gap: 8 },
  searchInput: { flex: 1, fontSize: 16 },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardImage: { width: '100%', height: 160 },
  cardBody: { padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  attachRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  viewBtn: { marginLeft: 'auto', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
});
