import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAnnouncements } from '@/hooks/useApi';

export default function AnnouncementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { data } = useAnnouncements();
  const item = data?.find((a) => a.id === id);

  if (!item) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text, textAlign: 'center', marginTop: 40 }}>Announcement not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Notice</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.hero} resizeMode="cover" />}
        <View style={styles.metaRow}>
          {item.priority && (
            <View style={[styles.priority, { backgroundColor: `${theme.colors.primary}1a` }]}>
              <MaterialIcons name="priority-high" size={14} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.primary, fontSize: 11, fontWeight: '700' }}>{item.priority}</Text>
            </View>
          )}
          <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>{item.postedAt} • {item.dateTime}</Text>
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
        <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{item.content ?? item.description}</Text>
        {item.attachments && item.attachments > 0 && (
          <View style={[styles.filesBox, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.filesTitle, { color: theme.colors.text }]}>Attachments ({item.attachments})</Text>
            {['Exam_Schedule.pdf', 'Guidelines.docx'].slice(0, item.attachments).map((f) => (
              <TouchableOpacity key={f} style={styles.fileRow}>
                <MaterialIcons name="description" size={22} color={theme.colors.primary} />
                <Text style={{ color: theme.colors.text, flex: 1, marginLeft: 10 }}>{f}</Text>
                <MaterialIcons name="download" size={22} color={theme.colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 80 },
  hero: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  priority: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  body: { fontSize: 15, lineHeight: 24 },
  filesBox: { marginTop: 24, padding: 16, borderRadius: 12, borderWidth: 1 },
  filesTitle: { fontWeight: '700', marginBottom: 12 },
  fileRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
});
