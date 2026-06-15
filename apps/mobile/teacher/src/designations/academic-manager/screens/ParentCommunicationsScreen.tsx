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
import { ManagerHeader } from '../components/ManagerHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import { initialManagerCirculars, type ManagerCircular, type ManagerCircularTab } from '../data/mockData';
import { colors, spacing, textStyle } from '@/designations/academic-manager/theme';
import { nextCircularNumber, shareCircularAsPdf } from '@/utils/circularPdf';

const TABS: ManagerCircularTab[] = ['Circulars', 'Notices', 'PTM'];
const VIEW_SHEET_MAX = Dimensions.get('window').height * 0.86;

function emptyForm() {
  return { title: '', body: '', audience: 'All Parents' };
}

export function ParentCommunicationsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<ManagerCircularTab>('Circulars');
  const [items, setItems] = useState<ManagerCircular[]>(initialManagerCirculars);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewItem, setViewItem] = useState<ManagerCircular | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const sheetBottomPad = Math.max(insets.bottom, 16);

  const stats = useMemo(
    () => ({
      sent: items.filter((i) => i.status.toLowerCase().includes('delivered')).length,
      drafts: items.filter((i) => i.date.toLowerCase() === 'draft').length,
    }),
    [items],
  );

  const visibleItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (item.tab !== tab) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.body.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q) ||
        item.audience.toLowerCase().includes(q)
      );
    });
  }, [items, tab, searchQuery]);

  const openCompose = (item?: ManagerCircular) => {
    if (item) {
      setEditingId(item.id);
      setForm({ title: item.title, body: item.body, audience: item.audience });
    } else {
      setEditingId(null);
      setForm(emptyForm());
    }
    setComposeOpen(true);
  };

  const saveCircular = () => {
    const title = form.title.trim();
    const body = form.body.trim();
    if (!title || !body) {
      Alert.alert('Missing details', 'Please enter a title and message.');
      return;
    }

    const existing = editingId ? items.find((i) => i.id === editingId) : undefined;
    const payload: ManagerCircular = {
      id: editingId ?? String(Date.now()),
      circularNo: existing?.circularNo ?? nextCircularNumber(items),
      title,
      body,
      audience: form.audience,
      tab,
      date: existing?.date ?? 'Draft',
      status: existing?.status ?? 'Draft saved',
    };

    setItems((prev) => {
      if (editingId) return prev.map((i) => (i.id === editingId ? { ...i, ...payload } : i));
      return [payload, ...prev];
    });
    setComposeOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    Alert.alert('Saved', editingId ? 'Circular updated.' : 'New circular saved as draft.');
  };

  const publishCircular = () => {
    const title = form.title.trim();
    const body = form.body.trim();
    if (!title || !body) {
      Alert.alert('Missing details', 'Please enter a title and message.');
      return;
    }

    const existing = editingId ? items.find((i) => i.id === editingId) : undefined;
    const id = editingId ?? String(Date.now());
    const payload: ManagerCircular = {
      id,
      circularNo: existing?.circularNo ?? nextCircularNumber(items),
      title,
      body,
      audience: form.audience,
      tab,
      date: 'Just now',
      status: 'Delivered 0/1,250',
    };

    setItems((prev) => {
      if (editingId) return prev.map((i) => (i.id === editingId ? payload : i));
      return [payload, ...prev];
    });
    setComposeOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    Alert.alert('Published', 'Circular sent to parents.');
  };

  const shareCircular = async (item: ManagerCircular) => {
    await shareCircularAsPdf({
      title: item.title,
      body: item.body,
      circularNo: item.circularNo,
      audience: item.audience,
      date: item.date,
    });
  };

  return (
    <>
    <ScreenShell scroll={false} paddingBottom={0}>
      <ManagerHeader title="Parent Communications" onBack={() => navigation.goBack()} />

      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={20} color={colors.onSurfaceVariant} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search circulars, notices, PTM..."
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

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.tabs}>
          {TABS.map((t) => (
            <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.stat}>{stats.sent} Sent This Month</Text>
          <Text style={styles.stat}>98% Delivery</Text>
          <Text style={styles.stat}>{stats.drafts} Drafts</Text>
        </View>

        {searchQuery ? (
          <Text style={styles.resultCount}>
            {visibleItems.length} result{visibleItems.length === 1 ? '' : 's'}
          </Text>
        ) : null}

        <View style={styles.content}>
          {visibleItems.length === 0 ? (
            <Text style={styles.empty}>No items match your search.</Text>
          ) : (
            visibleItems.map((c) => (
              <Card key={c.id} style={styles.circularCard}>
                <Text style={styles.circularTitle}>{c.title}</Text>
                <Text style={styles.circularNo}>{c.circularNo}</Text>
                <Text style={styles.circularDate}>{c.date} · {c.audience}</Text>
                <Text style={styles.circularPreview} numberOfLines={2}>
                  {c.body}
                </Text>
                <Text style={styles.circularStatus}>{c.status}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => setViewItem(c)} activeOpacity={0.7}>
                    <MaterialIcons name="visibility" size={18} color={colors.primary} />
                    <Text style={styles.actionText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => shareCircular(c)} activeOpacity={0.7}>
                    <MaterialIcons name="share" size={18} color={colors.primaryContainer} />
                    <Text style={styles.actionText}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => openCompose(c)} activeOpacity={0.7}>
                    <MaterialIcons name="edit" size={18} color={colors.onSurfaceVariant} />
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => openCompose()} activeOpacity={0.85}>
        <MaterialIcons name="edit" size={26} color={colors.onPrimary} />
      </TouchableOpacity>
    </ScreenShell>

    <Modal visible={!!viewItem} transparent animationType="slide" onRequestClose={() => setViewItem(null)}>
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.modalDismiss} onPress={() => setViewItem(null)} />
        <View style={[styles.sheet, { maxHeight: VIEW_SHEET_MAX, paddingBottom: sheetBottomPad }]}>
          {viewItem ? (
            <>
              <View style={styles.sheetHead}>
                <Text style={styles.sheetTitle}>Circular Details</Text>
                <TouchableOpacity onPress={() => setViewItem(null)}>
                  <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
              <Text style={styles.viewTitle}>{viewItem.title}</Text>
              <Text style={styles.viewCircularNo}>{viewItem.circularNo}</Text>
              <Text style={styles.viewMeta}>
                {viewItem.date} · {viewItem.audience}
              </Text>
              <Text style={styles.viewStatus}>{viewItem.status}</Text>
              <ScrollView style={styles.viewScroll} showsVerticalScrollIndicator={false} bounces={false}>
                <Text style={styles.viewBody}>{viewItem.body}</Text>
              </ScrollView>
              <View style={styles.sheetActions}>
                <TouchableOpacity style={styles.outlineBtn} onPress={() => shareCircular(viewItem)}>
                  <MaterialIcons name="share" size={18} color={colors.primary} />
                  <Text style={styles.outlineBtnText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setViewItem(null)}>
                  <Text style={styles.primaryBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>

    <Modal visible={composeOpen} transparent animationType="slide" onRequestClose={() => setComposeOpen(false)}>
      <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.modalDismiss} onPress={() => setComposeOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: sheetBottomPad }]}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>{editingId ? 'Edit Circular' : 'New Circular'}</Text>
            <TouchableOpacity onPress={() => setComposeOpen(false)}>
              <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
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
            placeholder="Write announcement..."
            placeholderTextColor={colors.outline}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.fieldLabel}>Audience</Text>
          <TextInput
            style={styles.input}
            value={form.audience}
            onChangeText={(t) => setForm((f) => ({ ...f, audience: t }))}
            placeholder="e.g. All Parents"
            placeholderTextColor={colors.outline}
          />
          <View style={styles.sheetActions}>
            <TouchableOpacity style={styles.outlineBtn} onPress={saveCircular}>
              <Text style={styles.outlineBtnText}>Save Draft</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={publishCircular}>
              <Text style={styles.primaryBtnText}>Publish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: spacing.gutter,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  searchInput: { flex: 1, ...textStyle('bodyMd'), color: colors.onSurface, padding: 0 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 88 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.outlineVariant, paddingHorizontal: spacing.gutter },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primaryContainer },
  tabText: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', padding: spacing.gutter, backgroundColor: colors.surfaceContainerLow },
  stat: { ...textStyle('chip10'), color: colors.onSurfaceVariant, fontWeight: '600' },
  resultCount: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, paddingHorizontal: spacing.gutter, paddingTop: spacing.sm },
  content: { padding: spacing.gutter, gap: 12 },
  empty: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, textAlign: 'center', fontStyle: 'italic', paddingVertical: 24 },
  circularCard: { gap: 6 },
  circularTitle: { ...textStyle('bodyMd'), fontWeight: '700' },
  circularNo: { ...textStyle('chip10'), color: colors.primary, fontWeight: '600' },
  circularDate: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  circularPreview: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, lineHeight: 20 },
  circularStatus: { ...textStyle('chip10'), color: colors.primary, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  actionText: { ...textStyle('chip10'), color: colors.onSurface, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: spacing.gutter,
    bottom: spacing.fabBottom,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalDismiss: { ...StyleSheet.absoluteFillObject },
  sheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.gutter,
    width: '100%',
    zIndex: 1,
  },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sheetTitle: { ...textStyle('titleLg'), fontWeight: '700' },
  viewTitle: { ...textStyle('headlineMd'), fontWeight: '600', marginBottom: 4 },
  viewCircularNo: { ...textStyle('chip10'), color: colors.primary, fontWeight: '700', marginBottom: 4 },
  viewMeta: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, marginBottom: 4 },
  viewStatus: { ...textStyle('chip10'), color: colors.primary, fontWeight: '700', marginBottom: 12 },
  viewScroll: { flexGrow: 0, maxHeight: VIEW_SHEET_MAX * 0.45, marginBottom: 12 },
  viewBody: { ...textStyle('bodyMd'), color: colors.onSurface, lineHeight: 22 },
  fieldLabel: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...textStyle('bodyMd'),
    color: colors.onSurface,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  outlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
    borderRadius: 8,
    paddingVertical: 12,
  },
  outlineBtnText: { ...textStyle('bodyMd'), color: colors.primary, fontWeight: '600' },
  primaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: 8,
    paddingVertical: 12,
  },
  primaryBtnText: { ...textStyle('bodyMd'), color: colors.onPrimary, fontWeight: '600' },
});
