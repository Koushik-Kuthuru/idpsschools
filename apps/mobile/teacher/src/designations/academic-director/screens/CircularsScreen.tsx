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
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AcademicHeader } from '../components/AcademicHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card, ProgressBar } from '../components/ui';
import { initialCirculars, type CircularItem, type CircularStatus } from '../data/mockData';
import type { AcademicColorScheme } from '../theme/colors';
import { spacing, textStyle, useAcademicTheme, useThemedStyles } from '@/designations/academic-director/theme';

const WINDOW_HEIGHT = Dimensions.get('window').height;
const VIEW_SHEET_MAX = WINDOW_HEIGHT * 0.86;
const COMPOSE_SHEET_MAX = WINDOW_HEIGHT * 0.92;
const COMPOSE_FOOTER_HEIGHT = 88;

const TABS = ['All', 'Published', 'Drafts', 'Scheduled'] as const;
const AUDIENCE = ['All Staff', 'Teachers', 'HODs', 'Parents', 'Students', 'Specific Dept'] as const;
const TAGS = ['Urgent', 'Academic', 'General', 'Draft'] as const;

type TabFilter = (typeof TABS)[number];
type AudienceFilter = (typeof AUDIENCE)[number];

function matchesAudience(item: CircularItem, filter: AudienceFilter): boolean {
  if (filter === 'All Staff') return true;
  const aud = item.audience.toLowerCase();
  if (filter === 'Teachers') return aud.includes('teacher');
  if (filter === 'HODs') return aud.includes('hod');
  if (filter === 'Parents') return aud.includes('parent');
  if (filter === 'Students') return aud.includes('student');
  return aud.includes('department') || aud.includes('dept');
}

function matchesTab(item: CircularItem, tab: TabFilter): boolean {
  if (tab === 'All') return true;
  if (tab === 'Published') return item.status === 'published';
  if (tab === 'Drafts') return item.status === 'draft';
  return item.status === 'scheduled';
}

function emptyForm(): { title: string; body: string; audience: string; tag: string } {
  return { title: '', body: '', audience: 'All Staff', tag: 'General' };
}

export function CircularsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useAcademicTheme();
  const styles = useThemedStyles(createStyles);
  const sheetBottomPad = Math.max(insets.bottom, 20);
  const [items, setItems] = useState<CircularItem[]>(initialCirculars);
  const [activeTab, setActiveTab] = useState<TabFilter>('All');
  const [audience, setAudience] = useState<AudienceFilter>('All Staff');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewItem, setViewItem] = useState<CircularItem | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const stats = useMemo(
    () => ({
      sent: items.filter((i) => i.status === 'published').length,
      drafts: items.filter((i) => i.status === 'draft').length,
      scheduled: items.filter((i) => i.status === 'scheduled').length,
    }),
    [items],
  );

  const visibleItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (!matchesTab(item, activeTab)) return false;
      if (!matchesAudience(item, audience)) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.body.toLowerCase().includes(q) ||
        item.audience.toLowerCase().includes(q) ||
        item.tag.toLowerCase().includes(q)
      );
    });
  }, [items, activeTab, audience, searchQuery]);

  const openCompose = (item?: CircularItem) => {
    if (item) {
      setEditingId(item.id);
      setForm({
        title: item.title,
        body: item.body,
        audience: item.audience,
        tag: item.tag === 'Draft' ? 'General' : item.tag,
      });
    } else {
      setEditingId(null);
      setForm(emptyForm());
    }
    setComposeOpen(true);
  };

  const saveCircular = (asDraft: boolean) => {
    const title = form.title.trim();
    const body = form.body.trim();
    if (!title || !body) {
      Alert.alert('Missing details', 'Please enter a title and message body.');
      return;
    }

    const status: CircularStatus = asDraft ? 'draft' : editingId && items.find((i) => i.id === editingId)?.status === 'scheduled' ? 'scheduled' : 'published';
    const payload: CircularItem = {
      id: editingId ?? String(Date.now()),
      title,
      body,
      audience: form.audience,
      tag: asDraft ? 'Draft' : form.tag,
      status,
      time: asDraft ? 'Draft' : status === 'scheduled' ? 'Scheduled' : 'Just now',
      ...(status === 'published' ? { read: 0, total: 100 } : {}),
      ...(status === 'scheduled' && !editingId ? { scheduledFor: 'Jun 16, 09:00 AM' } : {}),
    };

    setItems((prev) => {
      if (editingId) return prev.map((i) => (i.id === editingId ? { ...i, ...payload, id: editingId } : i));
      return [payload, ...prev];
    });
    setComposeOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    Alert.alert(asDraft ? 'Draft saved' : 'Published', asDraft ? 'Circular saved to drafts.' : 'Circular sent to recipients.');
  };

  const deleteCircular = (item: CircularItem) => {
    const label = item.status === 'scheduled' ? 'Cancel scheduled circular?' : 'Remove this draft permanently?';
    Alert.alert('Delete circular', label, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setItems((prev) => prev.filter((i) => i.id !== item.id)),
      },
    ]);
  };

  const isAudienceSelected = (selected: string, option: AudienceFilter) =>
    selected === option ||
    (option === 'Teachers' && selected.toLowerCase().includes('teacher')) ||
    (option === 'HODs' && selected.toLowerCase().includes('hod')) ||
    (option === 'Parents' && selected.toLowerCase().includes('parent')) ||
    (option === 'Students' && selected.toLowerCase().includes('student')) ||
    (option === 'Specific Dept' && (selected.toLowerCase().includes('department') || selected.toLowerCase().includes('dept')));

  const resendCircular = (item: CircularItem) => {
    Alert.alert('Resent', `"${item.title}" was resent to ${item.audience}.`);
  };

  return (
    <>
    <ScreenShell
      scroll={false}
      paddingBottom={0}
      header={
        <AcademicHeader
          title="Circulars & Announcements"
          onBack={() => navigation.goBack()}
          right={
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={() => {
                setSearchOpen((v) => !v);
                if (searchOpen) setSearchQuery('');
              }}
            >
              <MaterialIcons name={searchOpen ? 'close' : 'search'} size={22} color={searchOpen ? colors.primaryContainer : colors.onSurfaceVariant} />
            </TouchableOpacity>
          }
        />
      }
    >
      <View style={styles.screen}>
        {searchOpen ? (
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={colors.onSurfaceVariant} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search circulars..."
              placeholderTextColor={colors.outline}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="cancel" size={18} color={colors.outline} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        <ScrollView style={styles.pageScroll} contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
            <View style={styles.statChip}>
              <MaterialIcons name="send" size={18} color={colors.primaryContainer} />
              <Text style={styles.statText}>Sent This Month: {stats.sent}</Text>
            </View>
            <View style={[styles.statChip, styles.statDraft]}>
              <MaterialIcons name="edit-note" size={18} color={colors.tertiaryContainer} />
              <Text style={[styles.statText, { color: colors.tertiary }]}>Drafts: {stats.drafts}</Text>
            </View>
            <View style={[styles.statChip, styles.statScheduled]}>
              <MaterialIcons name="schedule" size={18} color={colors.secondary} />
              <Text style={[styles.statText, { color: colors.secondary }]}>Scheduled: {stats.scheduled}</Text>
            </View>
          </ScrollView>

          <View style={styles.tabs}>
            {TABS.map((tab) => (
              <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.audienceRow}>
            {AUDIENCE.map((a) => (
              <TouchableOpacity key={a} style={[styles.audienceChip, audience === a && styles.audienceActive]} onPress={() => setAudience(a)}>
                <Text style={[styles.audienceText, audience === a && styles.audienceTextActive]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {searchQuery ? (
            <Text style={styles.resultCount}>
              {visibleItems.length} result{visibleItems.length === 1 ? '' : 's'} for "{searchQuery}"
            </Text>
          ) : null}

          <View style={styles.list}>
            {visibleItems.length === 0 ? (
              <Text style={styles.empty}>No circulars match your filters.</Text>
            ) : (
              visibleItems.map((c) => (
                <Card key={c.id} style={c.status === 'draft' ? styles.draftCard : undefined}>
                  <View style={styles.cardHead}>
                    <Text style={[styles.tag, c.tag === 'Urgent' && styles.tagUrgent, c.tag === 'Draft' && styles.tagDraft, c.tag === 'Academic' && styles.tagAcademic]}>
                      {c.tag}
                    </Text>
                    <Text style={styles.time}>{c.scheduledFor ?? c.time}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{c.title}</Text>
                  <View style={styles.audienceLine}>
                    <MaterialIcons name="group" size={14} color={colors.onSurfaceVariant} />
                    <Text style={styles.audienceLineText}>{c.audience}</Text>
                  </View>
                  {c.read !== undefined && c.total ? (
                    <View style={styles.readBox}>
                      <Text style={styles.readLabel}>READ RECEIPT</Text>
                      <Text style={styles.readValue}>
                        {c.read}/{c.total} recipients
                      </Text>
                      <ProgressBar percent={(c.read / c.total) * 100} />
                    </View>
                  ) : null}
                  {c.status === 'draft' ? (
                    <View style={styles.actions}>
                      <TouchableOpacity style={styles.editBtn} onPress={() => openCompose(c)}>
                        <MaterialIcons name="edit" size={18} color={colors.onSurface} />
                        <Text style={styles.editText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteCircular(c)}>
                        <MaterialIcons name="delete" size={18} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  ) : c.status === 'scheduled' ? (
                    <View style={styles.actions}>
                      <TouchableOpacity style={styles.primaryBtn} onPress={() => setViewItem(c)}>
                        <MaterialIcons name="visibility" size={18} color={colors.onPrimary} />
                        <Text style={styles.primaryBtnText}>View</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.editBtn} onPress={() => openCompose(c)}>
                        <MaterialIcons name="edit" size={18} color={colors.onSurface} />
                        <Text style={styles.editText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteCircular(c)}>
                        <MaterialIcons name="delete" size={18} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.actions}>
                      <TouchableOpacity style={styles.primaryBtn} onPress={() => setViewItem(c)}>
                        <MaterialIcons name="visibility" size={18} color={colors.onPrimary} />
                        <Text style={styles.primaryBtnText}>View</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.outlineBtn} onPress={() => resendCircular(c)}>
                        <MaterialIcons name="refresh" size={18} color={colors.primary} />
                        <Text style={styles.outlineBtnText}>Resend</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </Card>
              ))
            )}
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.fab} onPress={() => openCompose()} activeOpacity={0.85}>
          <MaterialIcons name="edit" size={28} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>
    </ScreenShell>

    <Modal visible={!!viewItem} transparent animationType="slide" onRequestClose={() => setViewItem(null)}>
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.modalDismiss} onPress={() => setViewItem(null)} />
        <View style={[styles.sheet, { maxHeight: VIEW_SHEET_MAX }]}>
          {viewItem ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={[styles.sheetScrollContent, { paddingBottom: sheetBottomPad }]}
            >
              <View style={styles.modalHead}>
                <Text style={styles.modalTitle}>Circular Details</Text>
                <TouchableOpacity onPress={() => setViewItem(null)}>
                  <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.tag, viewItem.tag === 'Urgent' && styles.tagUrgent, styles.tagInline]}>{viewItem.tag}</Text>
              <Text style={styles.viewTitle}>{viewItem.title}</Text>
              <Text style={styles.viewMeta}>
                {viewItem.time} · {viewItem.audience}
              </Text>
              <Text style={styles.viewBody}>{viewItem.body}</Text>
              {viewItem.read !== undefined && viewItem.total ? (
                <View style={styles.readBox}>
                  <Text style={styles.readValue}>
                    {viewItem.read}/{viewItem.total} read ({Math.round((viewItem.read / viewItem.total) * 100)}%)
                  </Text>
                  <ProgressBar percent={(viewItem.read / viewItem.total) * 100} />
                </View>
              ) : null}
              <TouchableOpacity style={[styles.primaryBtn, styles.sheetFooterBtn]} onPress={() => setViewItem(null)}>
                <Text style={styles.primaryBtnText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>

    <Modal visible={composeOpen} transparent animationType="slide" onRequestClose={() => setComposeOpen(false)}>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <Pressable style={styles.modalDismiss} onPress={() => setComposeOpen(false)} />
        <View style={[styles.sheet, { maxHeight: COMPOSE_SHEET_MAX, paddingBottom: sheetBottomPad }]}>
          <View style={[styles.modalHead, styles.composeHead]}>
            <Text style={styles.modalTitle}>{editingId ? 'Edit Circular' : 'New Circular'}</Text>
            <TouchableOpacity onPress={() => setComposeOpen(false)}>
              <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={{ maxHeight: COMPOSE_SHEET_MAX - COMPOSE_FOOTER_HEIGHT - sheetBottomPad - 56 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.composeScrollContent}
          >
            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={(t) => setForm((f) => ({ ...f, title: t }))}
              placeholder="Circular title"
              placeholderTextColor={colors.outline}
            />
            <Text style={styles.fieldLabel}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.body}
              onChangeText={(t) => setForm((f) => ({ ...f, body: t }))}
              placeholder="Write announcement body..."
              placeholderTextColor={colors.outline}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <Text style={styles.fieldLabel}>Audience</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.formChipRow}>
              {AUDIENCE.map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[styles.formChip, isAudienceSelected(form.audience, a) && styles.formChipActive]}
                  onPress={() => setForm((f) => ({ ...f, audience: a }))}
                >
                  <Text style={[styles.formChipText, isAudienceSelected(form.audience, a) && styles.formChipTextActive]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.fieldLabel}>Tag</Text>
            <View style={styles.formChipRowWrap}>
              {TAGS.filter((t) => t !== 'Draft').map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.formChip, form.tag === t && styles.formChipActive]}
                  onPress={() => setForm((f) => ({ ...f, tag: t }))}
                >
                  <Text style={[styles.formChipText, form.tag === t && styles.formChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View style={styles.composeActions}>
            <TouchableOpacity style={styles.outlineBtn} onPress={() => saveCircular(true)}>
              <Text style={styles.outlineBtnText}>Save Draft</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => saveCircular(false)}>
              <Text style={styles.primaryBtnText}>Publish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
    </>
  );
}

const FAB_SIZE = 56;
const LIST_BOTTOM_PAD = FAB_SIZE + 24;

function createStyles(colors: AcademicColorScheme) {
  return StyleSheet.create({
  screen: { flex: 1, position: 'relative' },
  searchBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: spacing.gutter,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  searchInput: { flex: 1, ...textStyle('bodyMd'), color: colors.onSurface, padding: 0 },
  pageScroll: { flex: 1 },
  pageContent: { paddingBottom: LIST_BOTTOM_PAD },
  statsRow: { paddingHorizontal: spacing.gutter, gap: 12, paddingVertical: 12 },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: `${colors.primaryContainer}1a`,
    borderWidth: 1,
    borderColor: `${colors.primaryContainer}33`,
  },
  statDraft: { backgroundColor: `${colors.tertiaryFixedDim}33`, borderColor: `${colors.tertiaryFixedDim}4d` },
  statScheduled: { backgroundColor: `${colors.secondaryContainer}4d`, borderColor: `${colors.secondaryContainer}66` },
  statText: { ...textStyle('labelMd'), color: colors.primaryContainer },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primaryContainer },
  tabText: { ...textStyle('bodyMd'), color: colors.slate400 },
  tabTextActive: { color: colors.primaryContainer, fontWeight: '600' },
  audienceRow: { paddingHorizontal: spacing.gutter, gap: 8, paddingVertical: 16 },
  audienceChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.outlineVariant },
  audienceActive: { backgroundColor: colors.primaryContainer },
  audienceText: { fontSize: 12, fontWeight: '500', color: colors.onSurfaceVariant },
  audienceTextActive: { color: colors.onPrimary },
  resultCount: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, paddingHorizontal: spacing.gutter, marginBottom: 4 },
  list: { padding: spacing.gutter, gap: 16 },
  empty: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, textAlign: 'center', paddingVertical: 24 },
  draftCard: { borderStyle: 'dashed' },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tag: { ...textStyle('chip10'), paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, textTransform: 'uppercase', alignSelf: 'flex-start' },
  tagUrgent: { backgroundColor: `${colors.error}1a`, color: colors.error },
  tagDraft: { backgroundColor: `${colors.secondary}1a`, color: colors.secondary },
  tagAcademic: { backgroundColor: `${colors.primary}1a`, color: colors.primary },
  tagInline: { marginBottom: 8 },
  time: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  cardTitle: { ...textStyle('titleLg'), color: colors.onBackground, marginBottom: 8 },
  audienceLine: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  audienceLineText: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
  readBox: { backgroundColor: colors.surfaceContainerLow, borderRadius: 8, padding: 12, marginBottom: 12, gap: 8 },
  readLabel: { ...textStyle('chip10'), color: colors.onSurfaceVariant, letterSpacing: 2 },
  readValue: { ...textStyle('bodyLg'), fontWeight: '700', color: colors.primaryContainer },
  actions: { flexDirection: 'row', gap: 8 },
  primaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primaryContainer, borderRadius: 8, paddingVertical: 10 },
  primaryBtnText: { ...textStyle('bodyMd'), color: colors.onPrimary, fontWeight: '600' },
  outlineBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: colors.primaryContainer, borderRadius: 8, paddingVertical: 10 },
  outlineBtnText: { ...textStyle('bodyMd'), color: colors.primary, fontWeight: '600' },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.surfaceContainerHigh, borderRadius: 8, paddingVertical: 10, minWidth: 72 },
  editText: { ...textStyle('bodyMd'), fontWeight: '600' },
  deleteBtn: { paddingHorizontal: 16, borderWidth: 1, borderColor: colors.error, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  fab: {
    position: 'absolute',
    right: spacing.gutter,
    bottom: 24,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: 28,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalDismiss: { ...StyleSheet.absoluteFillObject },
  sheet: {
    width: '100%',
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    zIndex: 1,
  },
  sheetScrollContent: { padding: 20 },
  composeHead: { paddingHorizontal: 20, paddingTop: 20, marginBottom: 0 },
  composeScrollContent: { paddingHorizontal: 20, paddingBottom: 12 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { ...textStyle('titleLg'), fontWeight: '700' },
  viewTitle: { ...textStyle('headlineMd'), marginBottom: 4 },
  viewMeta: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, marginBottom: 12 },
  viewBody: { ...textStyle('bodyMd'), color: colors.onSurface, lineHeight: 22, marginBottom: 12 },
  sheetFooterBtn: { marginTop: 4 },
  fieldLabel: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...textStyle('bodyMd'),
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLowest,
  },
  textArea: { minHeight: 100 },
  formChipRow: { gap: 8, paddingVertical: 4 },
  formChipRowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 4 },
  formChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.outlineVariant },
  formChipActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  formChipText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  formChipTextActive: { color: colors.onPrimary, fontWeight: '700' },
  composeActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  });
}
