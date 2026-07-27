import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { useAcademicYears } from '@/hooks/useApi';
import { useAuthStore, useSettingsStore } from '@/store';
import { profileService } from '@/services/api';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cardShadow } from '@/constants/shadows';

export default function AcademicYearSettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch, isFetching } = useAcademicYears();
  const selectedAcademicYear = useSettingsStore((s) => s.selectedAcademicYear);
  const setSelectedAcademicYear = useSettingsStore((s) => s.setSelectedAcademicYear);
  const [saving, setSaving] = useState<string | null>(null);

  const schoolCurrent = data?.current ?? null;
  const years = data?.years ?? [];
  const activeYear = selectedAcademicYear ?? schoolCurrent;

  const applyYear = useCallback(
    async (year: string | null) => {
      const next = year?.trim() || null;
      // Selecting the school current year clears the override so future admin
      // changes still flow through until the student picks another year.
      const stored = next && schoolCurrent && next === schoolCurrent ? null : next;
      setSaving(next ?? 'school-current');
      try {
        await setSelectedAcademicYear(stored);
        await queryClient.clear();
        try {
          const profile = await profileService.get();
          useAuthStore.setState({ user: profile });
        } catch {
          // Profile refresh is best-effort; screens will refetch.
        }
        router.back();
      } finally {
        setSaving(null);
      }
    },
    [queryClient, router, schoolCurrent, setSelectedAcademicYear],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <ScreenHeader title="Academic year" fallbackRoute="/settings" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, cardShadow]}>
          <View style={styles.heroIcon}>
            <Ionicons name="calendar" size={28} color="#144835" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>DATA SCOPE</Text>
            <Text style={styles.heroTitle}>Academic year</Text>
            <Text style={styles.heroSub}>Fees, attendance, marks & timetable follow this year</Text>
          </View>
        </View>

        <SectionHeader title="Choose year" />
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : isError ? (
          <TouchableOpacity
            style={[styles.errorCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => void refetch()}
            activeOpacity={0.75}
          >
            <Text style={[styles.errorText, { color: theme.colors.text }]}>Could not load years</Text>
            <Text style={[styles.errorSub, { color: theme.colors.textSecondary }]}>
              {isFetching ? 'Retrying…' : 'Tap to retry'}
            </Text>
          </TouchableOpacity>
        ) : years.length === 0 ? (
          <View style={[styles.emptyCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No academic years are available for this school yet.
            </Text>
          </View>
        ) : (
          <View style={[styles.listCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            {years.map((year, index) => {
              const selected = activeYear === year.name;
              const busy = saving === year.name;
              return (
                <View key={year.name}>
                  {index > 0 ? <View style={[styles.divider, { backgroundColor: theme.colors.border }]} /> : null}
                  <TouchableOpacity
                    style={styles.row}
                    onPress={() => void applyYear(year.name)}
                    activeOpacity={0.75}
                    disabled={!!saving}
                  >
                    <View style={[styles.yearIcon, { backgroundColor: `${theme.colors.primary}14` }]}>
                      <Ionicons name="school-outline" size={18} color={theme.colors.primary} />
                    </View>
                    <View style={styles.yearCopy}>
                      <Text style={[styles.yearLabel, { color: theme.colors.text }]}>AY {year.name}</Text>
                      {year.isCurrent ? (
                        <Text style={[styles.yearSub, { color: theme.colors.textSecondary }]}>School current year</Text>
                      ) : null}
                    </View>
                    {busy ? (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : selected ? (
                      <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
                    ) : (
                      <Ionicons name="ellipse-outline" size={22} color={theme.colors.textMuted} />
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {selectedAcademicYear ? (
          <TouchableOpacity
            style={[styles.resetCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => void applyYear(null)}
            activeOpacity={0.75}
            disabled={!!saving}
          >
            <Text style={[styles.resetText, { color: theme.colors.primary }]}>Use school current year</Text>
            {schoolCurrent ? (
              <Text style={[styles.resetSub, { color: theme.colors.textSecondary }]}>Currently {schoolCurrent}</Text>
            ) : null}
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  heroCard: {
    backgroundColor: '#144835',
    borderRadius: 16,
    padding: 20,
    marginTop: 4,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#a2c144',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: { flex: 1 },
  heroEyebrow: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 4 },
  heroSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 },
  listCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  yearIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  yearCopy: { flex: 1 },
  yearLabel: { fontSize: 15, fontWeight: '700' },
  yearSub: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginHorizontal: 14 },
  center: { paddingVertical: 40, alignItems: 'center' },
  errorCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  errorText: { fontSize: 15, fontWeight: '700' },
  errorSub: { fontSize: 12, marginTop: 4 },
  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  emptyText: { fontSize: 13, lineHeight: 18 },
  resetCard: { borderRadius: 14, borderWidth: 1, padding: 14, alignItems: 'center' },
  resetText: { fontSize: 14, fontWeight: '700' },
  resetSub: { fontSize: 12, marginTop: 4 },
});
