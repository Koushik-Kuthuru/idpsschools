import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useProfile } from '@/hooks/useApi';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { cardShadow } from '@/constants/shadows';

export default function StudentIdCardScreen() {
  const theme = useTheme();
  const { data: profile, isLoading, error, refetch } = useProfile();

  if (isLoading) return <LoadingScreen />;
  if (error || !profile) return <ErrorScreen message="Failed to load ID card" onRetry={() => refetch()} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <ScreenHeader title="ID Card" fallbackRoute="/(tabs)/profile" />
      <View style={styles.content}>
        <View style={[styles.card, cardShadow]}>
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

          <View style={styles.cardFooter}>
            <Text style={styles.footerNote}>Valid for academic year 2025–26</Text>
            <View style={styles.barcode}>
              <Text style={styles.barcodeText}>{profile.studentId.replace(/-/g, '')}</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
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
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
  cardFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
  },
  footerNote: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  barcode: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  barcodeText: { fontSize: 12, fontWeight: '800', letterSpacing: 2, color: '#144835' },
});
