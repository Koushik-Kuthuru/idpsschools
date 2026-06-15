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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ManagerHeader } from '../components/ManagerHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import { DUTY_STAFF_CANDIDATES, useLeaveDutyStore } from '../store/leaveDutyStore';
import { handleManagerTabPress } from '../navigation/navigationHelpers';
import type { ManagerStackParamList } from '../navigation/types';
import { colors, spacing, textStyle } from '@/designations/academic-manager/theme';

type TabKey = 'Leave Requests' | 'Duty Assignments';

const FAB_SIZE = 56;

function emptyLeaveForm() {
  return { name: '', dept: '', type: '', dates: '', doc: '' };
}

function emptyDutyForm() {
  return { title: '', date: '', location: '', time: '', staffName: '' };
}

export function LeaveDutyManagementScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ManagerStackParamList>>();
  const [tab, setTab] = useState<TabKey>('Leave Requests');
  const [addOpen, setAddOpen] = useState(false);
  const [assignDutyId, setAssignDutyId] = useState<string | null>(null);
  const [leaveForm, setLeaveForm] = useState(emptyLeaveForm);
  const [dutyForm, setDutyForm] = useState(emptyDutyForm);

  const leaveRequests = useLeaveDutyStore((s) => s.leaveRequests);
  const dutyAssignments = useLeaveDutyStore((s) => s.dutyAssignments);
  const approveLeave = useLeaveDutyStore((s) => s.approveLeave);
  const rejectLeave = useLeaveDutyStore((s) => s.rejectLeave);
  const assignDuty = useLeaveDutyStore((s) => s.assignDuty);
  const completeDuty = useLeaveDutyStore((s) => s.completeDuty);
  const addLeaveRequest = useLeaveDutyStore((s) => s.addLeaveRequest);
  const addDutyAssignment = useLeaveDutyStore((s) => s.addDutyAssignment);

  const stats = useMemo(() => {
    const pending = leaveRequests.filter((r) => r.status === 'pending').length;
    const approvedMonth = leaveRequests.filter((r) => r.status === 'approved').length;
    const rejected = leaveRequests.filter((r) => r.status === 'rejected').length;
    return { pending, approvedMonth, rejected };
  }, [leaveRequests]);

  const pendingDuties = useMemo(
    () => dutyAssignments.filter((d) => d.status === 'pending' || d.status === 'assigned'),
    [dutyAssignments],
  );

  const handleApprove = (id: string, name: string) => {
    approveLeave(id);
    Alert.alert('Approved', `${name}'s leave request has been approved.`);
  };

  const handleReject = (id: string, name: string) => {
    Alert.alert('Reject leave', `Reject ${name}'s leave request?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => {
          rejectLeave(id);
          Alert.alert('Rejected', `${name}'s leave request was rejected.`);
        },
      },
    ]);
  };

  const handleAssignDuty = (staffName: string) => {
    if (!assignDutyId) return;
    assignDuty(assignDutyId, staffName);
    setAssignDutyId(null);
    Alert.alert('Duty assigned', `${staffName} has been assigned to this duty.`);
  };

  const handleCompleteDuty = (id: string, title: string) => {
    completeDuty(id);
    Alert.alert('Completed', `"${title}" marked as completed.`);
  };

  const submitLeave = () => {
    const name = leaveForm.name.trim();
    const dept = leaveForm.dept.trim();
    const type = leaveForm.type.trim();
    const dates = leaveForm.dates.trim();
    if (!name || !dept || !type || !dates) {
      Alert.alert('Missing details', 'Please fill name, department, leave type, and dates.');
      return;
    }
    addLeaveRequest({ name, dept, type, dates, doc: leaveForm.doc.trim() });
    setLeaveForm(emptyLeaveForm());
    setAddOpen(false);
    Alert.alert('Added', 'Leave request submitted for approval.');
  };

  const submitDuty = () => {
    const title = dutyForm.title.trim();
    const date = dutyForm.date.trim();
    const location = dutyForm.location.trim();
    const time = dutyForm.time.trim();
    if (!title || !date || !location || !time) {
      Alert.alert('Missing details', 'Please fill duty title, date, location, and time.');
      return;
    }
    addDutyAssignment({
      title,
      date,
      location,
      time,
      staffName: dutyForm.staffName.trim() || undefined,
    });
    setDutyForm(emptyDutyForm());
    setAddOpen(false);
    Alert.alert('Added', 'Duty assignment created.');
  };

  const statusStyle = (status: string) => {
    if (status === 'approved' || status === 'completed') return styles.statusOk;
    if (status === 'rejected') return styles.statusRejected;
    if (status === 'assigned') return styles.statusAssigned;
    return styles.statusPending;
  };

  return (
    <>
      <ScreenShell
        scroll={false}
        paddingBottom={0}
        activeTab="tasks"
        onTabPress={(t) => handleManagerTabPress(navigation, t)}
        header={
          <ManagerHeader
            title="Leave & Duty"
            right={
              <View style={styles.headerRight}>
                <MaterialIcons name="filter-list" size={22} color={colors.onSurfaceVariant} />
                <View style={styles.todayPill}>
                  <Text style={styles.todayText}>Today</Text>
                </View>
              </View>
            }
          />
        }
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {tab === 'Leave Requests' && stats.pending > 0 ? (
            <View style={styles.alertBanner}>
              <MaterialIcons name="pending-actions" size={20} color="#92400e" />
              <Text style={styles.alertText}>
                {stats.pending} Leave Request{stats.pending === 1 ? '' : 's'} Awaiting Approval
              </Text>
            </View>
          ) : null}

          <View style={styles.tabs}>
            {(['Leave Requests', 'Duty Assignments'] as TabKey[]).map((t) => (
              <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === 'Leave Requests' ? (
            <>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statVal}>{stats.pending}</Text>
                  <Text style={styles.statLbl}>Pending</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statVal}>{stats.approvedMonth}</Text>
                  <Text style={styles.statLbl}>Approved</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statVal}>{stats.rejected}</Text>
                  <Text style={styles.statLbl}>Rejected</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Recent Requests</Text>
              {leaveRequests.map((r) => (
                <Card key={r.id} style={styles.requestCard}>
                  <View style={styles.cardTop}>
                    <Text style={styles.requestName}>{r.name}</Text>
                    <Text style={[styles.statusBadge, statusStyle(r.status)]}>{r.status}</Text>
                  </View>
                  <Text style={styles.requestDept}>{r.dept}</Text>
                  <Text style={styles.requestType}>
                    {r.type} · {r.dates}
                  </Text>
                  {r.doc ? <Text style={styles.requestDoc}>{r.doc}</Text> : null}
                  {r.status === 'pending' ? (
                    <View style={styles.actions}>
                      <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(r.id, r.name)}>
                        <Text style={styles.rejectText}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(r.id, r.name)}>
                        <Text style={styles.approveText}>Approve</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </Card>
              ))}
            </>
          ) : (
            <>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statVal}>{pendingDuties.length}</Text>
                  <Text style={styles.statLbl}>Active</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statVal}>{dutyAssignments.filter((d) => d.status === 'assigned').length}</Text>
                  <Text style={styles.statLbl}>Assigned</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statVal}>{dutyAssignments.filter((d) => d.status === 'completed').length}</Text>
                  <Text style={styles.statLbl}>Completed</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Duty Roster</Text>
              {dutyAssignments.map((d) => (
                <Card key={d.id} style={styles.requestCard}>
                  <View style={styles.cardTop}>
                    <Text style={styles.requestName}>{d.title}</Text>
                    <Text style={[styles.statusBadge, statusStyle(d.status)]}>{d.status}</Text>
                  </View>
                  <Text style={styles.requestDept}>
                    {d.date} · {d.time}
                  </Text>
                  <Text style={styles.requestType}>{d.location}</Text>
                  <Text style={styles.requestDoc}>
                    Staff: {d.staffName}
                  </Text>
                  <View style={styles.actions}>
                    {d.status === 'pending' ? (
                      <TouchableOpacity style={styles.approveBtn} onPress={() => setAssignDutyId(d.id)}>
                        <MaterialIcons name="person-add" size={16} color={colors.onPrimaryContainer} />
                        <Text style={styles.approveText}>Assign Staff</Text>
                      </TouchableOpacity>
                    ) : null}
                    {d.status === 'assigned' ? (
                      <TouchableOpacity style={styles.approveBtn} onPress={() => handleCompleteDuty(d.id, d.title)}>
                        <MaterialIcons name="check-circle" size={16} color={colors.onPrimaryContainer} />
                        <Text style={styles.approveText}>Mark Complete</Text>
                      </TouchableOpacity>
                    ) : null}
                    {d.status === 'completed' ? (
                      <Text style={styles.completedNote}>Duty completed</Text>
                    ) : null}
                  </View>
                </Card>
              ))}
            </>
          )}
        </ScrollView>

        <TouchableOpacity style={styles.fab} onPress={() => setAddOpen(true)} activeOpacity={0.85}>
          <MaterialIcons name="add" size={28} color={colors.onPrimary} />
        </TouchableOpacity>
      </ScreenShell>

      <Modal visible={addOpen} transparent animationType="slide" onRequestClose={() => setAddOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setAddOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>
                {tab === 'Leave Requests' ? 'New Leave Request' : 'New Duty Assignment'}
              </Text>
              <TouchableOpacity onPress={() => setAddOpen(false)}>
                <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {tab === 'Leave Requests' ? (
              <>
                <Text style={styles.fieldLabel}>Staff name</Text>
                <TextInput
                  style={styles.input}
                  value={leaveForm.name}
                  onChangeText={(t) => setLeaveForm((f) => ({ ...f, name: t }))}
                  placeholder="e.g. Mrs. Kavitha Rao"
                  placeholderTextColor={colors.outline}
                />
                <Text style={styles.fieldLabel}>Department</Text>
                <TextInput
                  style={styles.input}
                  value={leaveForm.dept}
                  onChangeText={(t) => setLeaveForm((f) => ({ ...f, dept: t }))}
                  placeholder="e.g. English G6-8"
                  placeholderTextColor={colors.outline}
                />
                <Text style={styles.fieldLabel}>Leave type</Text>
                <TextInput
                  style={styles.input}
                  value={leaveForm.type}
                  onChangeText={(t) => setLeaveForm((f) => ({ ...f, type: t }))}
                  placeholder="e.g. Medical Leave"
                  placeholderTextColor={colors.outline}
                />
                <Text style={styles.fieldLabel}>Dates</Text>
                <TextInput
                  style={styles.input}
                  value={leaveForm.dates}
                  onChangeText={(t) => setLeaveForm((f) => ({ ...f, dates: t }))}
                  placeholder="e.g. 12–13 Jun"
                  placeholderTextColor={colors.outline}
                />
                <Text style={styles.fieldLabel}>Notes (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={leaveForm.doc}
                  onChangeText={(t) => setLeaveForm((f) => ({ ...f, doc: t }))}
                  placeholder="Supporting document or substitute"
                  placeholderTextColor={colors.outline}
                />
                <TouchableOpacity style={styles.submitBtn} onPress={submitLeave}>
                  <Text style={styles.submitText}>Submit Request</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>Duty title</Text>
                <TextInput
                  style={styles.input}
                  value={dutyForm.title}
                  onChangeText={(t) => setDutyForm((f) => ({ ...f, title: t }))}
                  placeholder="e.g. Morning Gate Duty"
                  placeholderTextColor={colors.outline}
                />
                <Text style={styles.fieldLabel}>Date</Text>
                <TextInput
                  style={styles.input}
                  value={dutyForm.date}
                  onChangeText={(t) => setDutyForm((f) => ({ ...f, date: t }))}
                  placeholder="e.g. 20 Jun"
                  placeholderTextColor={colors.outline}
                />
                <Text style={styles.fieldLabel}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={dutyForm.location}
                  onChangeText={(t) => setDutyForm((f) => ({ ...f, location: t }))}
                  placeholder="e.g. Main Gate"
                  placeholderTextColor={colors.outline}
                />
                <Text style={styles.fieldLabel}>Time</Text>
                <TextInput
                  style={styles.input}
                  value={dutyForm.time}
                  onChangeText={(t) => setDutyForm((f) => ({ ...f, time: t }))}
                  placeholder="e.g. 07:30–08:15"
                  placeholderTextColor={colors.outline}
                />
                <Text style={styles.fieldLabel}>Assign staff (optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {DUTY_STAFF_CANDIDATES.map((name) => (
                    <TouchableOpacity
                      key={name}
                      style={[styles.chip, dutyForm.staffName === name && styles.chipActive]}
                      onPress={() => setDutyForm((f) => ({ ...f, staffName: name }))}
                    >
                      <Text style={[styles.chipText, dutyForm.staffName === name && styles.chipTextActive]}>{name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity style={styles.submitBtn} onPress={submitDuty}>
                  <Text style={styles.submitText}>Create Duty</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={!!assignDutyId} transparent animationType="fade" onRequestClose={() => setAssignDutyId(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setAssignDutyId(null)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Assign Staff</Text>
            <Text style={styles.modalSub}>Select a staff member for this duty.</Text>
            {DUTY_STAFF_CANDIDATES.map((name) => (
              <TouchableOpacity key={name} style={styles.pickRow} onPress={() => handleAssignDuty(name)}>
                <MaterialIcons name="person" size={18} color={colors.primaryContainer} />
                <Text style={styles.pickText}>{name}</Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.gutter, gap: 16, paddingBottom: FAB_SIZE + spacing.fabBottom + 16 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  todayPill: { backgroundColor: colors.primaryContainer, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  todayText: { ...textStyle('chip10'), color: colors.onPrimaryContainer },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  alertText: { ...textStyle('bodyMd'), color: '#92400e', fontWeight: '600' },
  tabs: { flexDirection: 'row', backgroundColor: colors.surfaceContainerLow, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: colors.surfaceContainerLowest },
  tabText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
  },
  statVal: { fontSize: 20, fontWeight: '700' },
  statLbl: { ...textStyle('chip10'), color: colors.onSurfaceVariant, textAlign: 'center' },
  sectionTitle: { ...textStyle('titleLg') },
  requestCard: { gap: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  requestName: { ...textStyle('bodyMd'), fontWeight: '700', flex: 1 },
  statusBadge: { ...textStyle('chip10'), paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, textTransform: 'capitalize', fontWeight: '700' },
  statusPending: { backgroundColor: '#fffbeb', color: '#92400e' },
  statusOk: { backgroundColor: `${colors.primaryContainer}22`, color: colors.primary },
  statusRejected: { backgroundColor: `${colors.error}18`, color: colors.error },
  statusAssigned: { backgroundColor: `${colors.tertiary}18`, color: colors.tertiary },
  requestDept: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  requestType: { ...textStyle('bodyMd'), fontWeight: '500' },
  requestDoc: { ...textStyle('chip10'), color: colors.primary },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' },
  rejectBtn: { flex: 1, borderWidth: 1, borderColor: colors.error, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  rejectText: { ...textStyle('labelMd'), color: colors.error, fontWeight: '600' },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primaryContainer,
    borderRadius: 8,
    paddingVertical: 8,
  },
  approveText: { ...textStyle('labelMd'), color: colors.onPrimaryContainer, fontWeight: '600' },
  completedNote: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, fontStyle: 'italic' },
  fab: {
    position: 'absolute',
    right: spacing.gutter,
    bottom: spacing.fabBottom,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.gutter,
    maxHeight: '85%',
  },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { ...textStyle('titleLg'), fontWeight: '700' },
  modalSub: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, marginBottom: 12 },
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
  chipRow: { gap: 8, paddingVertical: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.outlineVariant },
  chipActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  chipText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  chipTextActive: { color: colors.onPrimary, fontWeight: '700' },
  submitBtn: {
    marginTop: 16,
    backgroundColor: colors.primaryContainer,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitText: { ...textStyle('bodyMd'), color: colors.onPrimary, fontWeight: '700' },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: 8,
  },
  pickText: { ...textStyle('bodyMd'), flex: 1 },
});
