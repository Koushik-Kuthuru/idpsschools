import { useState, useMemo, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { TabScreenHeader } from '@/components/ui/TabScreenHeader';
import { cardShadow } from '@/constants/shadows';
import { TAB_SCREEN_SCROLL_PADDING } from '@/constants/layout';
import { appNavigate } from '@/utils/navigation';
import { getCourseIdFromSubject } from '@/utils/courses';
import {
  filterAssignmentsByAssignedDay,
  formatHomeworkNavDate,
  getWorkItemStatusLabel,
  getWorkItemTypeLabel,
  shiftCalendarDay,
  startOfDay,
} from '@/utils/workItems';
import { useTimetable, useAssignments, useProfile } from '@/hooks/useApi';
import { useHomeworkUnread } from '@/hooks/useHomeworkUnread';
import { ProfileSkeleton as LoadingSkeleton } from '@/components/ui/Skeleton';
import type { Assignment } from '@/types';

const PASTEL_COLORS = [
  { bg: '#fce7f3', text: '#be185d' }, // pink
  { bg: '#e0f2fe', text: '#0369a1' }, // light blue
  { bg: '#ecfdf5', text: '#047857' }, // emerald
  { bg: '#fef3c7', text: '#b45309' }, // amber
  { bg: '#f3e8ff', text: '#7e22ce' }, // purple
];

function getInitials(subject: string) {
  return subject.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase();
}

const STATUS_COLORS: Record<Assignment['status'], string> = {
  pending: '#d97706',
  submitted: '#16a34a',
  overdue: '#ef4444',
};

export default function LearningTab() {
  const theme = useTheme();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<'subjects' | 'homework'>(tab === 'homework' ? 'homework' : 'subjects');
  const [homeworkDate, setHomeworkDate] = useState(() => startOfDay(new Date()));
  
  const { data: timetableData, isLoading: isTimetableLoading } = useTimetable();
  const { data: assignmentsData, isLoading: isAssignmentsLoading } = useAssignments();
  const { data: profile } = useProfile();
  const { unreadCount, markAllSeen } = useHomeworkUnread();

  useFocusEffect(
    useCallback(() => {
      if (tab === 'homework') {
        setActiveTab('homework');
      }
    }, [tab]),
  );

  useEffect(() => {
    if (activeTab === 'homework' && unreadCount > 0) {
      void markAllSeen();
    }
  }, [activeTab, unreadCount, markAllSeen]);

  const headerSubtitle = profile?.className
    ? `${profile.className} · Subjects & homework`
    : 'Subjects, homework & course resources';

  const subjects = useMemo(() => {
    if (!timetableData) return [];
    const map = new Map<string, { subject: string; teacher: string; courseId?: string }>();
    timetableData.forEach(day => {
      day.slots.forEach(slot => {
        if (!slot.isBreak && slot.subject) {
          map.set(slot.subject, {
            subject: slot.subject,
            teacher: slot.teacher,
            courseId: getCourseIdFromSubject(slot.subject, slot.courseId),
          });
        }
      });
    });
    return Array.from(map.values());
  }, [timetableData]);

  const dailyHomework = useMemo(
    () => filterAssignmentsByAssignedDay(assignmentsData ?? [], homeworkDate),
    [assignmentsData, homeworkDate],
  );

  const isLoading = isTimetableLoading || isAssignmentsLoading;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TabScreenHeader title="Learning Management" subtitle={headerSubtitle} />

      <View style={[styles.tabBar, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'subjects' && { borderBottomColor: theme.colors.primary }]}
          onPress={() => setActiveTab('subjects')}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'subjects' ? styles.tabTextActive : styles.tabTextIdle,
              { color: activeTab === 'subjects' ? theme.colors.primary : theme.colors.textSecondary },
            ]}
          >
            Subjects
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'homework' && { borderBottomColor: theme.colors.primary }]}
          onPress={() => setActiveTab('homework')}
          activeOpacity={0.85}
        >
          <View style={styles.tabLabelRow}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'homework' ? styles.tabTextActive : styles.tabTextIdle,
                { color: activeTab === 'homework' ? theme.colors.primary : theme.colors.textSecondary },
              ]}
            >
              Homework
            </Text>
            {unreadCount > 0 && activeTab !== 'homework' ? (
              <View style={[styles.tabCountBadge, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.tabCountBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {isLoading ? (
           <LoadingSkeleton />
        ) : activeTab === 'subjects' ? (
           <>
             {subjects.map((sub, index) => {
               const colorClass = PASTEL_COLORS[index % PASTEL_COLORS.length];
               return (
                 <TouchableOpacity 
                   key={sub.subject} 
                   style={[styles.subjectCard, cardShadow, { backgroundColor: theme.colors.card }]}
                   onPress={() => appNavigate({ pathname: '/timetable/[courseId]', params: { courseId: sub.courseId, subject: sub.subject } })}
                   activeOpacity={0.85}
                 >
                   <View style={[styles.subjectBadge, { backgroundColor: colorClass.bg }]}>
                     <Text style={[styles.subjectBadgeText, { color: colorClass.text }]}>{getInitials(sub.subject)}</Text>
                   </View>
                   <View style={styles.subjectCopy}>
                     <Text style={[styles.subjectTitle, { color: theme.colors.text }]}>{sub.subject.toUpperCase()}</Text>
                     <Text style={[styles.subjectTeacher, { color: theme.colors.textSecondary }]}>{sub.teacher || 'Not Assigned'}</Text>
                   </View>
                 </TouchableOpacity>
               );
             })}
           </>
        ) : (
           <>
             <HomeworkDateNav
               date={homeworkDate}
               onPrevious={() => setHomeworkDate((current) => shiftCalendarDay(current, -1))}
               onNext={() => setHomeworkDate((current) => shiftCalendarDay(current, 1))}
               theme={theme}
             />

             {dailyHomework.length === 0 ? (
               <View style={[styles.emptyHomework, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                 <Ionicons name="book-outline" size={28} color={theme.colors.textMuted} />
                 <Text style={[styles.emptyHomeworkTitle, { color: theme.colors.text }]}>No homework for this day</Text>
                 <Text style={[styles.emptyHomeworkSub, { color: theme.colors.textSecondary }]}>
                   Check yesterday or tomorrow using the arrows above.
                 </Text>
               </View>
             ) : (
               dailyHomework.map((hw) => (
                 <TouchableOpacity
                   key={hw.id}
                   style={[styles.subjectCard, cardShadow, { backgroundColor: theme.colors.card }]}
                   onPress={() => appNavigate({ pathname: '/assignments/[id]', params: { id: hw.id } })}
                   activeOpacity={0.85}
                 >
                   <View style={[styles.subjectBadge, { backgroundColor: 'rgba(217, 119, 6, 0.1)' }]}>
                     <Ionicons name="document-text" size={24} color="#d97706" />
                   </View>
                   <View style={styles.subjectCopy}>
                     <Text style={[styles.subjectTitle, { color: theme.colors.text }]} numberOfLines={2}>{hw.title}</Text>
                     <Text style={[styles.subjectTeacher, { color: theme.colors.textSecondary }]}>
                       {hw.subject} · {hw.teacher}
                     </Text>
                     <Text style={[styles.homeworkMeta, { color: theme.colors.textMuted }]}>
                       {getWorkItemTypeLabel(hw.type)} · Due {hw.dueDate}
                     </Text>
                   </View>
                   <View style={[styles.statusPill, { backgroundColor: `${STATUS_COLORS[hw.status]}18` }]}>
                     <Text style={[styles.statusPillText, { color: STATUS_COLORS[hw.status] }]}>
                       {getWorkItemStatusLabel(hw.status)}
                     </Text>
                   </View>
                 </TouchableOpacity>
               ))
             )}
           </>
        )}
      </ScrollView>
    </View>
  );
}

function HomeworkDateNav({
  date,
  onPrevious,
  onNext,
  theme,
}: {
  date: Date;
  onPrevious: () => void;
  onNext: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.homeworkNav}>
      <Text style={[styles.homeworkNavLabel, { color: theme.colors.textSecondary }]}>Class homework</Text>
      <View style={styles.homeworkNavControls}>
        <TouchableOpacity
          onPress={onPrevious}
          style={[styles.homeworkNavBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
          accessibilityRole="button"
          accessibilityLabel="Previous day"
        >
          <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.homeworkNavDate, { color: theme.colors.text }]}>{formatHomeworkNavDate(date)}</Text>
        <TouchableOpacity
          onPress={onNext}
          style={[styles.homeworkNavBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
          accessibilityRole="button"
          accessibilityLabel="Next day"
        >
          <Ionicons name="chevron-forward" size={18} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
    textAlign: 'center',
  },
  tabTextActive: {
    fontWeight: '700',
  },
  tabTextIdle: {
    fontWeight: '600',
  },
  tabLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabCountBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCountBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 13,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: TAB_SCREEN_SCROLL_PADDING,
  },
  homeworkNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  homeworkNavLabel: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 0,
  },
  homeworkNavControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
  homeworkNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeworkNavDate: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 132,
    textAlign: 'center',
  },
  emptyHomework: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  emptyHomeworkTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyHomeworkSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  subjectBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  subjectBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subjectCopy: {
    flex: 1,
    justifyContent: 'center',
  },
  subjectTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 20,
  },
  subjectTeacher: {
    fontSize: 13,
  },
  homeworkMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginLeft: 8,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
