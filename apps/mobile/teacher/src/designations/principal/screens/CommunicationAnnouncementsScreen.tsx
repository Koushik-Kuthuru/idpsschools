import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { PrincipalHeader } from '../components/PrincipalHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import {
  commAudiences,
  commCategories,
  commChannels,
  commItems,
  commPeriods,
  recentMessages,
  type CommAudienceFilter,
  type CommCategory,
  type CommChannel,
  type CommItem,
  type CommMessage,
  type CommPeriodFilter,
} from '../data/mockData';
import { spacing, textStyle, usePrincipalTheme, useThemedStyles } from '@/designations/principal/theme';
import type { PrincipalColorScheme } from '@/designations/principal/theme/colors';

const AUDIENCE = ['All Staff', 'Parents', 'Students'] as const;

function categoryStyle(cat: string, palette: PrincipalColorScheme) {
  if (cat === 'Holiday') return { bg: palette.blue500, text: palette.onPrimary };
  if (cat === 'Academic') return { bg: palette.primaryContainer, text: palette.onPrimary };
  if (cat === 'Alert') return { bg: palette.dangerText, text: palette.onPrimary };
  return { bg: palette.surfaceContainerHigh, text: palette.onSurface };
}

function matchesAudience(item: CommItem | CommMessage, audience: CommAudienceFilter): boolean {
  if (audience === 'All') return true;
  if ('audienceKey' in item) return item.audienceKey === audience;
  return audience === 'Staff';
}

export function CommunicationAnnouncementsScreen() {
  const { colors } = usePrincipalTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation();
  const [channel, setChannel] = useState<CommChannel>('Announcements');
  const [category, setCategory] = useState<CommCategory>('All');
  const [audienceFilter, setAudienceFilter] = useState<CommAudienceFilter>('All');
  const [period, setPeriod] = useState<CommPeriodFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [viewItem, setViewItem] = useState<CommItem | CommMessage | null>(null);
  const [audience, setAudience] = useState<(typeof AUDIENCE)[number]>('All Staff');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (category !== 'All') n += 1;
    if (audienceFilter !== 'All') n += 1;
    if (period !== 'all') n += 1;
    if (searchQuery.trim()) n += 1;
    return n;
  }, [audienceFilter, category, period, searchQuery]);

  const visibleCommItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return commItems.filter((item) => {
      if (item.channel !== channel) return false;
      if (category !== 'All' && item.category !== category) return false;
      if (!matchesAudience(item, audienceFilter)) return false;
      if (period !== 'all' && item.period !== period) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.body.toLowerCase().includes(q) ||
        item.audience.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [audienceFilter, category, channel, period, searchQuery]);

  const visibleMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return recentMessages.filter((m) => {
      if (!matchesAudience(m, audienceFilter)) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.preview.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
      );
    });
  }, [audienceFilter, searchQuery]);

  const pinnedItem = useMemo(
    () => commItems.find((i) => i.pinned && i.channel === channel) ?? commItems.find((i) => i.pinned),
    [channel],
  );

  const clearFilters = () => {
    setCategory('All');
    setAudienceFilter('All');
    setPeriod('all');
    setSearchQuery('');
  };

  const publish = () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Missing details', 'Enter subject and message.');
      return;
    }
    setComposeOpen(false);
    setSubject('');
    setMessage('');
    Alert.alert('Published', 'Announcement published.');
  };

  const isMessages = channel === 'Messages';

  return (
    <>
      <ScreenShell
        scroll={false}
        paddingBottom={0}
        header={
          <PrincipalHeader
            title="Communication"
            onBack={() => navigation.goBack()}
            right={
              <TouchableOpacity
                onPress={() => setShowFilters(true)}
                activeOpacity={0.7}
                style={styles.filterHeaderBtn}
              >
                <MaterialIcons name="tune" size={22} color={colors.onSurfaceVariant} />
                {activeFilterCount > 0 ? (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            }
          />
        }
      >
        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={20} color={colors.onSurfaceVariant} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search announcements, circulars, messages..."
            placeholderTextColor={colors.outline}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
              <MaterialIcons name="close" size={18} color={colors.outline} />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.channelRow}
          style={styles.channelScroll}
        >
          {commChannels.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.channelTab, channel === c && styles.channelTabActive]}
              onPress={() => setChannel(c)}
              activeOpacity={0.7}
            >
              <Text style={[styles.channelTabText, channel === c && styles.channelTabTextActive]} numberOfLines={1}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {activeFilterCount > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFilterRow}>
            {category !== 'All' ? (
              <View style={styles.activeChip}>
                <Text style={styles.activeChipText}>{category}</Text>
              </View>
            ) : null}
            {audienceFilter !== 'All' ? (
              <View style={styles.activeChip}>
                <Text style={styles.activeChipText}>{audienceFilter}</Text>
              </View>
            ) : null}
            {period !== 'all' ? (
              <View style={styles.activeChip}>
                <Text style={styles.activeChipText}>{commPeriods.find((p) => p.key === period)?.label}</Text>
              </View>
            ) : null}
            {searchQuery.trim() ? (
              <View style={styles.activeChip}>
                <Text style={styles.activeChipText} numberOfLines={1}>
                  "{searchQuery.trim()}"
                </Text>
              </View>
            ) : null}
            <TouchableOpacity style={styles.clearChip} onPress={clearFilters} activeOpacity={0.7}>
              <Text style={styles.clearChipText}>Clear</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : null}

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {!isMessages && pinnedItem ? (
            <TouchableOpacity style={styles.pinned} onPress={() => setViewItem(pinnedItem)} activeOpacity={0.85}>
              <MaterialIcons name="push-pin" size={18} color={colors.amber600} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pinnedTitle}>{pinnedItem.title}</Text>
                <Text style={styles.pinnedSub}>{pinnedItem.body}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          ) : null}

          <View style={styles.resultHead}>
            <Text style={styles.sectionTitle}>{isMessages ? 'Inbox' : 'Recent Updates'}</Text>
            <Text style={styles.resultCount}>
              {isMessages ? visibleMessages.length : visibleCommItems.length} item
              {(isMessages ? visibleMessages.length : visibleCommItems.length) === 1 ? '' : 's'}
            </Text>
          </View>

          {isMessages ? (
            visibleMessages.length === 0 ? (
              <Text style={styles.empty}>No messages match your filters.</Text>
            ) : (
              visibleMessages.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.msgRow, m.unread && styles.msgUnread]}
                  onPress={() => setViewItem(m)}
                  activeOpacity={0.7}
                >
                  <View style={styles.msgAvatar}>
                    <Text style={styles.msgInitials}>{m.name[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.msgHead}>
                      <Text style={styles.msgName}>{m.name}</Text>
                      {m.unread ? <View style={styles.unreadDot} /> : null}
                    </View>
                    <Text style={styles.msgRole}>{m.role}</Text>
                    <Text style={styles.msgPreview} numberOfLines={1}>
                      {m.preview}
                    </Text>
                    <Text style={styles.msgTime}>{m.time}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
              ))
            )
          ) : visibleCommItems.length === 0 ? (
            <Text style={styles.empty}>No items match your filters. Try adjusting category, audience, or time.</Text>
          ) : (
            visibleCommItems.map((a) => {
              const cs = categoryStyle(a.category, colors);
              return (
                <TouchableOpacity key={a.id} onPress={() => setViewItem(a)} activeOpacity={0.85}>
                  <Card style={styles.annCard}>
                    <View style={styles.annTop}>
                      <View style={[styles.badge, { backgroundColor: cs.bg }]}>
                        <Text style={[styles.badgeText, { color: cs.text }]}>{a.category}</Text>
                      </View>
                      <Text style={styles.annTime}>{a.time}</Text>
                    </View>
                    <Text style={styles.annTitle}>{a.title}</Text>
                    <Text style={styles.annPreview} numberOfLines={2}>
                      {a.body}
                    </Text>
                    <Text style={styles.annMeta}>{a.audience}</Text>
                    {a.views > 0 || a.notifications > 0 ? (
                      <Text style={styles.annStats}>
                        {a.views > 0 ? `${a.views} views` : ''}
                        {a.views > 0 && a.notifications > 0 ? ' · ' : ''}
                        {a.notifications > 0 ? `${a.notifications} notifications` : ''}
                      </Text>
                    ) : null}
                  </Card>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        <TouchableOpacity style={styles.fab} onPress={() => setComposeOpen(true)} activeOpacity={0.85}>
          <MaterialIcons name="edit-note" size={26} color={colors.onPrimaryContainer} />
        </TouchableOpacity>
      </ScreenShell>

      {/* Filter summary sheet */}
      <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setShowFilters(false)}>
          <Pressable style={styles.filterSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Filter & sort</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetSection}>Channel</Text>
            <View style={styles.sheetChannelGrid}>
              {commChannels.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.sheetChannelChip, channel === c && styles.chipActive]}
                  onPress={() => setChannel(c)}
                >
                  <Text style={[styles.chipText, channel === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sheetSection}>Category</Text>
            <View style={styles.sheetWrapRow}>
              {commCategories.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.sheetChip, category === c && styles.chipActive]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sheetSection}>Audience</Text>
            <View style={styles.sheetWrapRow}>
              {commAudiences.map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[styles.sheetChip, audienceFilter === a && styles.chipActive]}
                  onPress={() => setAudienceFilter(a)}
                >
                  <Text style={[styles.chipText, audienceFilter === a && styles.chipTextActive]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sheetSection}>Time period</Text>
            <View style={styles.sheetWrapRow}>
              {commPeriods.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.sheetChip, period === p.key && styles.chipActive]}
                  onPress={() => setPeriod(p.key)}
                >
                  <Text style={[styles.chipText, period === p.key && styles.chipTextActive]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.outlineBtn} onPress={clearFilters}>
                <Text style={styles.outlineBtnText}>Reset all</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowFilters(false)}>
                <Text style={styles.primaryBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Detail view */}
      <Modal visible={!!viewItem} transparent animationType="slide" onRequestClose={() => setViewItem(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setViewItem(null)}>
          <Pressable style={styles.detailSheet} onPress={(e) => e.stopPropagation()}>
            {viewItem ? (
              <>
                <View style={styles.sheetHead}>
                  <Text style={styles.sheetTitle}>
                    {'name' in viewItem ? viewItem.name : viewItem.title}
                  </Text>
                  <TouchableOpacity onPress={() => setViewItem(null)}>
                    <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>
                {'role' in viewItem ? (
                  <>
                    <Text style={styles.detailMeta}>{viewItem.role} · {viewItem.time}</Text>
                    <ScrollView style={styles.detailScroll}>
                      <Text style={styles.detailBody}>{viewItem.body}</Text>
                    </ScrollView>
                  </>
                ) : (
                  <>
                    <View style={styles.detailBadges}>
                      <View style={[styles.badge, { backgroundColor: categoryStyle(viewItem.category, colors).bg }]}>
                        <Text style={[styles.badgeText, { color: categoryStyle(viewItem.category, colors).text }]}>
                          {viewItem.category}
                        </Text>
                      </View>
                      <Text style={styles.detailMeta}>{viewItem.time} · {viewItem.audience}</Text>
                    </View>
                    <ScrollView style={styles.detailScroll}>
                      <Text style={styles.detailBody}>{viewItem.body}</Text>
                    </ScrollView>
                  </>
                )}
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setViewItem(null)}>
                  <Text style={styles.primaryBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Compose */}
      <Modal visible={composeOpen} transparent animationType="slide" onRequestClose={() => setComposeOpen(false)}>
        <KeyboardAvoidingView style={styles.sheetBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setComposeOpen(false)}>
            <Pressable style={styles.composeSheet} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.sheetTitle}>Compose Announcement</Text>
              <Text style={styles.fieldLabel}>Channel</Text>
              <View style={styles.sheetWrapRow}>
                {(['Announcements', 'Circulars', 'Notice Board', 'SMS/Email'] as const).map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.sheetChip, channel === c && styles.chipActive]}
                    onPress={() => setChannel(c)}
                  >
                    <Text style={[styles.chipText, channel === c && styles.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.fieldLabel}>Target audience</Text>
              <View style={styles.audienceRow}>
                {AUDIENCE.map((a) => (
                  <TouchableOpacity
                    key={a}
                    style={[styles.audChip, audience === a && styles.audActive]}
                    onPress={() => setAudience(a)}
                  >
                    <Text style={[styles.audText, audience === a && styles.audTextActive]}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.fieldLabel}>Subject</Text>
              <TextInput
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                placeholder="Subject"
                placeholderTextColor={colors.outline}
              />
              <Text style={styles.fieldLabel}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={message}
                onChangeText={setMessage}
                placeholder="Write announcement..."
                placeholderTextColor={colors.outline}
                multiline
              />
              <TouchableOpacity style={styles.publishBtn} onPress={publish}>
                <Text style={styles.publishText}>Publish Now</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function createStyles(colors: PrincipalColorScheme) {
  return StyleSheet.create({
  filterHeaderBtn: { padding: 4, position: 'relative' },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: { ...textStyle('chip10'), color: colors.onError, fontSize: 9 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: spacing.gutter,
    marginTop: spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  searchInput: { flex: 1, ...textStyle('bodyMd'), fontSize: 13, color: colors.onSurface, padding: 0 },
  channelScroll: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  channelRow: { paddingHorizontal: spacing.gutter, gap: 6, paddingVertical: 6 },
  channelTab: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: colors.outlineVariant },
  channelTabActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  channelTabText: { ...textStyle('chip10'), color: colors.onSurfaceVariant, fontWeight: '600' },
  channelTabTextActive: { color: colors.onPrimary, fontWeight: '700' },
  activeFilterRow: { paddingHorizontal: spacing.gutter, gap: 6, paddingVertical: 4, alignItems: 'center' },
  activeChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: `${colors.primaryContainer}22`, borderWidth: 1, borderColor: colors.primaryContainer },
  activeChipText: { ...textStyle('chip10'), color: colors.primary, fontWeight: '700' },
  clearChip: { paddingHorizontal: 8, paddingVertical: 3 },
  clearChipText: { ...textStyle('chip10'), color: colors.primary, fontWeight: '700' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLowest },
  chipActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  chipText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  chipTextActive: { color: colors.onPrimary, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 100 },
  pinned: {
    flexDirection: 'row',
    gap: 12,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.pinnedBg,
    borderWidth: 1,
    borderColor: colors.pinnedBorder,
    alignItems: 'center',
  },
  pinnedTitle: { ...textStyle('bodyMd'), fontWeight: '700' },
  pinnedSub: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, marginTop: 2 },
  resultHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...textStyle('titleLg'), fontWeight: '600' },
  resultCount: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  empty: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, fontStyle: 'italic', textAlign: 'center', paddingVertical: 24 },
  annCard: { gap: 6 },
  annTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { ...textStyle('chip10'), fontWeight: '700' },
  annTime: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  annTitle: { ...textStyle('bodyMd'), fontWeight: '700' },
  annPreview: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, lineHeight: 20 },
  annMeta: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  annStats: { ...textStyle('chip10'), color: colors.primary },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  msgUnread: { backgroundColor: colors.green50, borderLeftWidth: 3, borderLeftColor: colors.primaryContainer },
  msgAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.secondaryContainer, alignItems: 'center', justifyContent: 'center' },
  msgInitials: { ...textStyle('labelMd'), fontWeight: '700' },
  msgHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  msgName: { ...textStyle('bodyMd'), fontWeight: '600' },
  msgRole: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  msgPreview: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  msgTime: { ...textStyle('chip10'), color: colors.onSurfaceVariant, marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  fab: {
    position: 'absolute',
    right: spacing.gutter,
    bottom: spacing.fabBottom,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  filterSheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.gutter,
    paddingBottom: spacing.lg,
    maxHeight: '88%',
  },
  detailSheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.gutter,
    paddingBottom: spacing.lg,
    maxHeight: '80%',
  },
  composeSheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.gutter,
    paddingBottom: spacing.lg,
  },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sheetTitle: { ...textStyle('titleLg'), fontWeight: '700', flex: 1 },
  sheetSection: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  sheetChannelGrid: { gap: 8 },
  sheetChannelChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  sheetWrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sheetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: spacing.md },
  outlineBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryContainer,
    borderRadius: 10,
    paddingVertical: 12,
  },
  outlineBtnText: { ...textStyle('bodyMd'), color: colors.primary, fontWeight: '600' },
  primaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: spacing.sm,
  },
  primaryBtnText: { ...textStyle('bodyMd'), color: colors.onPrimary, fontWeight: '700' },
  detailMeta: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, marginBottom: 12 },
  detailBadges: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' },
  detailScroll: { maxHeight: 260, marginBottom: spacing.sm },
  detailBody: { ...textStyle('bodyMd'), color: colors.onSurface, lineHeight: 22 },
  fieldLabel: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, marginBottom: 6, marginTop: 8 },
  audienceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  audChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.outlineVariant },
  audActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  audText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  audTextActive: { color: colors.onPrimary, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: 10, padding: 12, ...textStyle('bodyMd'), color: colors.onSurface },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  publishBtn: { marginTop: 16, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 8 },
  publishText: { ...textStyle('bodyMd'), color: colors.onPrimary, fontWeight: '700' },
});
}
