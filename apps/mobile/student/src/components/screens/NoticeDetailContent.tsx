import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import type { AnnouncementDetail } from '@/types';

export function NoticeDetailContent({ item }: { item: AnnouncementDetail }) {
  const theme = useTheme();
  const files =
    item.attachmentFiles ??
    (item.attachments
      ? Array.from({ length: item.attachments }, (_, i) => `Attachment_${i + 1}.pdf`)
      : []);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.hero} resizeMode="cover" /> : null}
      <View style={styles.metaRow}>
        {item.priority ? (
          <View style={[styles.priority, { backgroundColor: `${theme.colors.primary}1a` }]}>
            <MaterialIcons name="priority-high" size={14} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.primary, fontSize: 11, fontWeight: '700' }}>{item.priority}</Text>
          </View>
        ) : null}
        <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
          {item.postedAt} • {item.dateTime}
        </Text>
      </View>
      <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{item.content ?? item.description}</Text>
      {files.length > 0 ? (
        <View style={[styles.filesBox, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.filesTitle, { color: theme.colors.text }]}>Attached files ({files.length})</Text>
          {files.map((file, index) => (
            <View key={`${item.id}-file-${index}`} style={[styles.fileRow, { borderTopColor: theme.colors.border }]}>
              <MaterialIcons name="description" size={22} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.text, flex: 1, marginLeft: 10 }} numberOfLines={2}>
                {file}
              </Text>
              <TouchableOpacity accessibilityLabel={`Download ${file}`}>
                <MaterialIcons name="download" size={22} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 80 },
  hero: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  priority: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  body: { fontSize: 15, lineHeight: 24 },
  filesBox: { marginTop: 24, padding: 16, borderRadius: 12, borderWidth: 1 },
  filesTitle: { fontWeight: '700', marginBottom: 12 },
  fileRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
});
