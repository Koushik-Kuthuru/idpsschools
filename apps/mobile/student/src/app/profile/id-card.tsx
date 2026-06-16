import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useProfile } from '@/hooks/useApi';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { AdmissionBarcode } from '@/components/id-card/AdmissionBarcode';
import { cardShadow } from '@/constants/shadows';
import type { User } from '@/types';

export default function StudentIdCardScreen() {
  const theme = useTheme();
  const { data: profile, isLoading, error, refetch } = useProfile();

  if (isLoading) return <LoadingScreen />;
  if (error || !profile) return <ErrorScreen message="Failed to load ID card" onRetry={() => refetch()} />;

  const academicYear = profile.idCardAcademicYear ?? '2025–26';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <ScreenHeader title="ID Card" fallbackRoute="/(tabs)/profile" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          {profile.idCardImageUrl ? (
            <AdminGeneratedIdCard profile={profile} academicYear={academicYear} />
          ) : (
            <DefaultIdCard profile={profile} academicYear={academicYear} />
          )}

          <View style={[styles.barcodeSection, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.slate50 }]}>
            <AdmissionBarcode admissionNumber={profile.studentId} />
          </View>
        </View>

        <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
          {profile.idCardImageUrl
            ? 'Official ID card issued by your school administration.'
            : 'Your digital ID card. Contact the school office if details need updating.'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function AdminGeneratedIdCard({ profile, academicYear }: { profile: User; academicYear: string }) {
  return (
    <View style={styles.adminCardWrap}>
      <Image source={{ uri: profile.idCardImageUrl }} style={styles.adminCardImage} resizeMode="contain" accessibilityLabel={`${profile.name} student ID card`} />
      <View style={styles.adminMeta}>
        <Text style={styles.adminMetaText}>{profile.name}</Text>
        <Text style={styles.adminMetaSub}>Adm. {profile.studentId} · {profile.className} · AY {academicYear}</Text>
      </View>
    </View>
  );
}

function DefaultIdCard({ profile, academicYear }: { profile: User; academicYear: string }) {
  return (
    <>
      <View style={styles.cardHeader}>
        <View style={styles.logoWrap}>
          <Ionicons name="school" size={22} color="#144835" />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.schoolName} numberOfLines={2}>
            {profile.schoolName}
          </Text>
          <Text style={styles.cardType}>STUDENT IDENTITY CARD</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.photoWrap}>
          {profile.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.photo} />
          ) : (
            <View style={styles.photoFallback}>
              <Ionicons name="person" size={48} color="#144835" />
            </View>
          )}
        </View>
        <View style={styles.details}>
          <Text style={styles.studentName} numberOfLines={2}>
            {profile.name}
          </Text>
          <IdRow label="Admission No." value={profile.studentId} />
          <IdRow label="Class" value={profile.className} />
          <IdRow label="Roll No." value={profile.rollNumber} />
          <IdRow label="Grade" value={profile.grade} />
        </View>
      </View>

      <View style={[styles.templateFooter, { borderTopColor: '#e2e8f0' }]}>
        <Text style={styles.footerNote}>Valid for academic year {academicYear}</Text>
      </View>
    </>
  );
}

function IdRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.idRow}>
      <Text style={styles.idLabel}>{label}</Text>
      <Text style={styles.idValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 32, flexGrow: 1, justifyContent: 'center' },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  adminCardWrap: {
    padding: 12,
    gap: 10,
  },
  adminCardImage: {
    width: '100%',
    minHeight: 220,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  adminMeta: {
    paddingHorizontal: 6,
    paddingBottom: 4,
    gap: 2,
  },
  adminMetaText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  adminMetaSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#144835',
    padding: 16,
  },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#a2c144',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1 },
  schoolName: { color: '#fff', fontSize: 14, fontWeight: '800', lineHeight: 18 },
  cardType: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
  cardBody: { flexDirection: 'row', padding: 18, gap: 16 },
  photoWrap: {
    width: 96,
    height: 118,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#144835',
    backgroundColor: '#f8fafc',
  },
  photo: { width: '100%', height: '100%' },
  photoFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  details: { flex: 1, justifyContent: 'center', gap: 8 },
  studentName: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  idRow: { gap: 2 },
  idLabel: { fontSize: 10, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4 },
  idValue: { fontSize: 14, fontWeight: '700', color: '#144835' },
  templateFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  footerNote: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  barcodeSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  helperText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 12,
  },
});
