import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAssignments } from '@/hooks/useApi';
import { OverviewCard } from '@/components/cards/DashboardCards';
import { LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { SCHOOL_NAME } from '@/constants/config';
import {
  getWorkItemIcon,
  getWorkItemIconStyle,
  getWorkItemOverviewSubtitle,
  getWorkItemStatusLabel,
  groupAssignmentsBySubject,
} from '@/utils/workItems';

export default function AssignmentsOverviewScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useAssignments();

  if (isLoading) return <LoadingScreen />;
  if (error && !data) return <ErrorScreen message="Failed to load homework" onRetry={() => refetch()} />;

  const items = data ?? [];
  const subjectGroups = groupAssignmentsBySubject(items);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Homeworks / Projects</Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 11 }}>{SCHOOL_NAME}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/assignments')}>
          <MaterialIcons name="list" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {subjectGroups.length === 0 ? (
          <OverviewCard
            icon="assignment"
            iconColor={theme.colors.textMuted}
            iconBg={`${theme.colors.textMuted}1a`}
            accentColor={theme.colors.textMuted}
            title="No work items assigned"
            subtitle="Homework and projects from your teachers will appear here, grouped by subject"
          />
        ) : (
          subjectGroups.map((group) => (
            <View key={group.subject} style={styles.subjectSection}>
              <View style={styles.subjectHeader}>
                <View style={[styles.subjectIcon, { backgroundColor: `${theme.colors.primary}1a` }]}>
                  <MaterialIcons name="menu-book" size={18} color={theme.colors.primary} />
                </View>
                <Text style={[styles.subjectTitle, { color: theme.colors.text }]}>{group.subject}</Text>
                <View style={[styles.countBadge, { backgroundColor: `${theme.colors.primary}1a` }]}>
                  <Text style={{ color: theme.colors.primary, fontSize: 10, fontWeight: '700' }}>
                    {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                  </Text>
                </View>
              </View>
              {group.items.map((item) => {
                const iconStyle = getWorkItemIconStyle(item.type, theme.colors.primary, theme.colors.blue500, theme.colors.amber500);
                return (
                  <OverviewCard
                    key={item.id}
                    icon={getWorkItemIcon(item.type)}
                    iconColor={iconStyle.iconColor}
                    iconBg={iconStyle.iconBg}
                    accentColor={iconStyle.iconColor}
                    title={item.title}
                    subtitle={getWorkItemOverviewSubtitle(item)}
                    badge={getWorkItemStatusLabel(item.status)}
                    onPress={() => router.push(`/assignments/${item.id}`)}
                  />
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1 },
  backBtn: { padding: 8 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  scroll: { padding: 16, paddingBottom: 32 },
  subjectSection: { marginBottom: 24 },
  subjectHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  subjectIcon: { padding: 8, borderRadius: 8 },
  subjectTitle: { flex: 1, fontSize: 16, fontWeight: '700' },
  countBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
});
