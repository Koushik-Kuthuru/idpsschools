import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useDashboard, useProfile } from '@/hooks/useApi';
import { OverviewCard } from '@/components/cards/DashboardCards';
import { formatINR } from '@/utils/currency';
import { LoadingScreen } from '@/components/ui/ScreenHeader';

export default function RefinedDashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: dashboard, isLoading } = useDashboard();
  const { data: profile } = useProfile();

  if (isLoading || !dashboard) return <LoadingScreen />;

  const quickLinks = [
    { icon: 'assignment' as const, label: 'Projects', route: '/assignments' },
    { icon: 'event' as const, label: 'Exams', route: '/exams/schedule' },
    { icon: 'schedule' as const, label: 'Class timetable', route: '/timetable' },
    { icon: 'campaign' as const, label: 'Notice board', route: '/(tabs)/notice-board' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          {profile?.avatar && <Image source={{ uri: profile.avatar }} style={styles.avatar} />}
          <View>
            <Text style={[styles.greeting, { color: theme.colors.text }]}>Good Morning, {dashboard.studentName}! 👋</Text>
            <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>{dashboard.schoolName}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push('/notifications' as '/assignments')}>
          <MaterialIcons name="notifications" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          <MaterialIcons name="calendar-today" size={18} color={theme.colors.primary} /> Today's Overview
        </Text>
        <OverviewCard icon="menu-book" iconColor={theme.colors.primary} iconBg={`${theme.colors.primary}1a`} accentColor={theme.colors.primary} title={`${dashboard.classesToday} Classes Today`} subtitle={`Next: ${dashboard.nextClass}`} badge="Active" />
        <OverviewCard icon="person" iconColor={theme.colors.blue500} iconBg="rgba(59,130,246,0.1)" accentColor={theme.colors.blue500} title={`${dashboard.attendancePercent}% Average Attendance`} subtitle={`Status: ${dashboard.attendanceStatus}`} />

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          <MaterialIcons name="insights" size={18} color={theme.colors.primary} /> Quick Stats
        </Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '600' }}>MARKS</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>GPA: {dashboard.gpa}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '600' }}>FEES DUE</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{formatINR(dashboard.feesDue)}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Access</Text>
        <View style={styles.linksGrid}>
          {quickLinks.map((link) => (
            <TouchableOpacity key={link.label} style={[styles.linkCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} onPress={() => router.push(link.route as '/assignments')}>
              <MaterialIcons name={link.icon} size={28} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: 12, marginTop: 8 }}>{link.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, gap: 12 },
  headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  greeting: { fontSize: 16, fontWeight: '700' },
  scroll: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 8 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1 },
  statValue: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  linksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  linkCard: { width: '47%', alignItems: 'center', padding: 20, borderRadius: 12, borderWidth: 1 },
});
