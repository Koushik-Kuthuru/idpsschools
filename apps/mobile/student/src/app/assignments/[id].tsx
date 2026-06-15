import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAssignment } from '@/hooks/useApi';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { getWorkItemTypeLabel } from '@/utils/workItems';

export default function AssignmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useAssignment(id ?? '');

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message="Assignment not found" onRetry={() => refetch()} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScreenHeader title="Assignment Details" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.headerCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{data.title}</Text>
          <View style={styles.metaRow}>
            <MaterialIcons name="subject" size={16} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.textSecondary }}>{data.subject} • Class {data.className}</Text>
          </View>
          <View style={styles.metaRow}>
            <MaterialIcons name="category" size={16} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.textSecondary }}>{getWorkItemTypeLabel(data.type)}</Text>
          </View>
          <View style={styles.metaRow}>
            <MaterialIcons name="person" size={16} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.textSecondary }}>{data.teacher}</Text>
          </View>
          <View style={styles.metaRow}>
            <MaterialIcons name="event" size={16} color={theme.colors.red500} />
            <Text style={{ color: theme.colors.red500, fontWeight: '600' }}>Due: {data.dueDate}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Description</Text>
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{data.description}</Text>

        {data.status !== 'submitted' && (
          <Button
            title="SUBMIT ASSIGNMENT"
            onPress={() => router.push(`/assignments/${id}/submit`)}
            icon="upload"
            style={{ marginTop: 24 }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16 },
  headerCard: { padding: 20, borderRadius: 12, borderWidth: 1, marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  description: { fontSize: 15, lineHeight: 24 },
});
