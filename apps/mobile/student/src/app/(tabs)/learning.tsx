import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { type Href } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { TabScreenHeader } from '@/components/ui/TabScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cardShadow } from '@/constants/shadows';
import { TAB_SCREEN_SCROLL_PADDING } from '@/constants/layout';
import { appNavigate } from '@/utils/navigation';

type LearningItem = {
  icon: keyof typeof Ionicons.glyphMap;
  materialIcon?: keyof typeof MaterialIcons.glyphMap;
  label: string;
  sub: string;
  route: Href;
  accent: string;
  accentBg: string;
};

const LEARNING_ITEMS: LearningItem[] = [
  {
    icon: 'calendar-outline',
    label: 'Class timetable',
    sub: 'Daily schedule & subjects',
    route: '/timetable',
    accent: '#2563eb',
    accentBg: 'rgba(37, 99, 235, 0.1)',
  },
  {
    icon: 'folder-open-outline',
    label: 'Projects',
    sub: 'Homework & submissions',
    route: '/assignments',
    accent: '#d97706',
    accentBg: 'rgba(217, 119, 6, 0.1)',
  },
  {
    icon: 'document-text-outline',
    label: 'Exam schedule',
    sub: 'Dates, halls & timings',
    route: '/exams/schedule',
    accent: '#144835',
    accentBg: 'rgba(20, 72, 53, 0.1)',
  },
  {
    icon: 'bar-chart-outline',
    label: 'Marks',
    sub: 'Grades & performance',
    route: '/marks',
    accent: '#7c3aed',
    accentBg: 'rgba(124, 58, 237, 0.1)',
  },
  {
    icon: 'checkmark-circle-outline',
    label: 'Attendance',
    sub: 'Monthly & subject stats',
    route: '/(tabs)/attendance',
    accent: '#144835',
    accentBg: 'rgba(20, 72, 53, 0.1)',
  },
  {
    icon: 'book-outline',
    materialIcon: 'menu-book',
    label: 'Lesson plans',
    sub: 'Syllabus via timetable',
    route: '/timetable',
    accent: '#0d9488',
    accentBg: 'rgba(13, 148, 136, 0.1)',
  },
];

export default function LearningTab() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TabScreenHeader title="Learning Management" subtitle="Courses, projects & academic tools" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Academic tools" />
        <View style={styles.grid}>
          {LEARNING_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              activeOpacity={0.85}
              onPress={() => appNavigate(item.route)}
              style={[styles.card, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <View style={[styles.iconWrap, { backgroundColor: item.accentBg }]}>
                {item.materialIcon ? (
                  <MaterialIcons name={item.materialIcon} size={22} color={item.accent} />
                ) : (
                  <Ionicons name={item.icon} size={22} color={item.accent} />
                )}
              </View>
              <Text style={[styles.cardLabel, { color: theme.colors.text }]}>{item.label}</Text>
              <Text style={[styles.cardSub, { color: theme.colors.textSecondary }]}>{item.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: TAB_SCREEN_SCROLL_PADDING },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '48%',
    flexGrow: 1,
    minWidth: '47%',
    maxWidth: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    minHeight: 128,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardLabel: { fontSize: 15, fontWeight: '700' },
  cardSub: { fontSize: 12, marginTop: 4, lineHeight: 17 },
});
