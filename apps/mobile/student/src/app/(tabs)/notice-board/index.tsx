import { useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAnnouncements, useProfile } from '@/hooks/useApi';
import { LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { TabScreenHeader } from '@/components/ui/TabScreenHeader';
import { cardShadow } from '@/constants/shadows';
import { TAB_SCREEN_SCROLL_PADDING } from '@/constants/layout';
import type { AnnouncementDetail } from '@/types';

type FilterKey = 'all' | 'general' | 'important' | 'events' | 'holiday';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'general', label: 'Announcements' },
  { key: 'events', label: 'Events' },
  { key: 'holiday', label: 'Holidays' },
  { key: 'important', label: 'Urgent' },
];

const DEFAULT_AUTHORS: Record<AnnouncementDetail['category'], string> = {
  important: 'IDPS ADMIN | EXAMINATION CELL',
  holiday: 'IDPS ADMIN | GENERAL NOTICES',
  events: 'IDPS ADMIN | SPORTS DEPARTMENT',
  general: 'IDPS ADMIN | LIBRARY',
};

function authorInitials(name: string): string {
  const parts = name.split('|')[0]?.trim() ?? name;
  return parts
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function attachmentList(item: AnnouncementDetail): string[] {
  if (item.attachmentFiles?.length) return item.attachmentFiles;
  if (!item.attachments) return [];
  return Array.from({ length: item.attachments }, (_, i) => `Attachment_${i + 1}.pdf`);
}

export default function NoticeBoardTab() {
  const theme = useTheme();
  const { data: profile } = useProfile();
  const { data, isLoading, error, refetch, isRefetching } = useAnnouncements();
  const [filter, setFilter] = useState<FilterKey>('all');
  const notices = data ?? [];
  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long' });
  const headerSubtitle = profile?.className ? `${profile.className} · ${monthLabel}` : monthLabel;

  const filtered = useMemo(() => {
    const list = filter === 'all' ? notices : notices.filter((item) => item.category === filter);
    return [...list].sort((a, b) => Number(b.isNew) - Number(a.isNew));
  }, [notices, filter]);

  if (isLoading) return <LoadingScreen />;
  if (error && !data) return <ErrorScreen message="Failed to load notice board" onRetry={() => refetch()} />;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TabScreenHeader title="Notice board" subtitle={headerSubtitle} />

      <View style={[styles.filterStrip, { borderBottomColor: theme.colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((item) => {
            const active = filter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => setFilter(item.key)}
                activeOpacity={0.85}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? theme.colors.card : theme.colors.slate100,
                    borderColor: active ? theme.colors.text : theme.colors.border,
                  },
                  active && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: active ? theme.colors.text : theme.colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.primary} />}
      >
        {filtered.length === 0 ? (
          <View style={[styles.emptyCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Ionicons name="newspaper-outline" size={32} color={theme.colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No notices in this category</Text>
          </View>
        ) : (
          filtered.map((item) => <NoticeFeedCard key={item.id} item={item} theme={theme} />)
        )}
      </ScrollView>
    </View>
  );
}

function NoticeFeedCard({ item, theme }: { item: AnnouncementDetail; theme: ReturnType<typeof useTheme> }) {
  const author = item.postedBy ?? DEFAULT_AUTHORS[item.category];
  const initials = authorInitials(author);
  const files = attachmentList(item);
  const timestamp = item.dateTime ?? item.postedAt ?? item.timeAgo;
  const detailHref = `/notice-board/${item.id}` as const;

  return (
    <View style={[styles.feedCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Link href={detailHref} asChild>
        <Pressable style={styles.cardLink}>
          <View style={styles.authorRow}>
            <View style={[styles.avatar, { backgroundColor: `${theme.colors.primary}18` }]}>
              <Text style={[styles.avatarText, { color: theme.colors.primary }]}>{initials}</Text>
            </View>
            <View style={styles.authorCopy}>
              <Text style={[styles.authorName, { color: theme.colors.text }]} numberOfLines={1}>
                {author}
              </Text>
              <Text style={[styles.timestamp, { color: theme.colors.textMuted }]}>{timestamp}</Text>
            </View>
            {item.isNew ? (
              <View style={[styles.newPill, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.newPillText}>NEW</Text>
              </View>
            ) : null}
          </View>

          <Text style={[styles.postTitle, { color: theme.colors.text }]}>{item.title}</Text>
          <Text style={[styles.postBody, { color: theme.colors.textSecondary }]}>{item.description}</Text>

          {files.length > 0 ? (
            <View style={styles.attachBlock}>
              <Text style={[styles.attachLabel, { color: theme.colors.text }]}>Attached files:</Text>
              {files.map((file, index) => (
                <View
                  key={`${item.id}-file-${index}`}
                  style={[styles.fileRow, { backgroundColor: theme.colors.slate100, borderColor: theme.colors.border }]}
                >
                  <View style={[styles.fileIcon, { backgroundColor: `${theme.colors.red500}14` }]}>
                    <Ionicons name="document-text" size={18} color={theme.colors.red500} />
                  </View>
                  <Text style={[styles.fileName, { color: theme.colors.text }]} numberOfLines={2}>
                    {file}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </Pressable>
      </Link>

      <View style={[styles.actionRow, { borderTopColor: theme.colors.border }]}>
        <View style={styles.reactions}>
          {[
            { icon: 'heart-outline' as const, label: 'Like' },
            { icon: 'thumbs-up-outline' as const, label: 'Upvote' },
            { icon: 'happy-outline' as const, label: 'React' },
            { icon: 'bulb-outline' as const, label: 'Insight' },
          ].map((action) => (
            <Pressable key={action.icon} style={styles.reactionBtn} accessibilityLabel={action.label}>
              <Ionicons name={action.icon} size={20} color={theme.colors.textMuted} />
            </Pressable>
          ))}
        </View>
        <Link href={detailHref} asChild>
          <Pressable accessibilityLabel="Comments">
            <Ionicons name="chatbubble-outline" size={20} color={theme.colors.textMuted} />
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterStrip: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: 52,
  },
  filterScroll: { flexGrow: 0, height: 52 },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 140,
  },
  filterChipActive: { borderWidth: 1.5 },
  filterChipText: { fontSize: 13, fontWeight: '600' },
  scrollView: { flex: 1 },
  scroll: {
    paddingHorizontal: TAB_SCREEN_SCROLL_PADDING,
    paddingTop: 12,
    paddingBottom: TAB_SCREEN_SCROLL_PADDING,
    gap: 12,
  },
  feedCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 4,
    overflow: 'hidden',
  },
  cardLink: { gap: 0 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '800' },
  authorCopy: { flex: 1, minWidth: 0 },
  authorName: { fontSize: 13, fontWeight: '800', letterSpacing: 0.1 },
  timestamp: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  newPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  newPillText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  postTitle: { fontSize: 16, fontWeight: '800', lineHeight: 22, marginBottom: 8 },
  postBody: { fontSize: 14, lineHeight: 21 },
  attachBlock: { marginTop: 16, gap: 8 },
  attachLabel: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  fileIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 17 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  reactions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reactionBtn: { padding: 6 },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
});
