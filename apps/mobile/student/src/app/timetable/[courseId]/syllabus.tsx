import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useCourseDetail } from '@/hooks/useApi';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { formatUnitLabel } from '@/utils/courses';
import type { CourseSyllabusChapter, CourseSyllabusTopic, CourseTopicAttachment } from '@/types';

const ATTACHMENT_ICONS: Record<CourseTopicAttachment['type'], keyof typeof Ionicons.glyphMap> = {
  pdf: 'document-text-outline',
  notes: 'reader-outline',
  link: 'link-outline',
  video: 'play-circle-outline',
};

export default function CourseSyllabusScreen() {
  const theme = useTheme();
  const { courseId, subject } = useLocalSearchParams<{ courseId: string; subject?: string }>();
  const id = courseId ?? '';
  const { data, isLoading, error, refetch } = useCourseDetail(id, subject);
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<CourseSyllabusTopic | null>(null);

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message="Failed to load lesson plan" onRetry={() => refetch()} />;

  const toggleUnit = (unitId: string) => {
    setExpandedUnitId((current) => (current === unitId ? null : unitId));
  };

  const openTopic = (topic: CourseSyllabusTopic) => {
    if (topic.attachments?.length) {
      setSelectedTopic(topic);
      return;
    }
    setSelectedTopic({ ...topic, attachments: [] });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <ScreenHeader title="Lesson Plan" fallbackRoute={`/timetable/${id}`} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {data.syllabus.map((unit) => (
          <UnitAccordion
            key={unit.id}
            unit={unit}
            expanded={expandedUnitId === unit.id}
            onToggle={() => toggleUnit(unit.id)}
            onTopicPress={openTopic}
            theme={theme}
          />
        ))}
      </ScrollView>

      <TopicAttachmentsModal
        topic={selectedTopic}
        onClose={() => setSelectedTopic(null)}
        theme={theme}
      />
    </SafeAreaView>
  );
}

function UnitAccordion({
  unit,
  expanded,
  onToggle,
  onTopicPress,
  theme,
}: {
  unit: CourseSyllabusChapter;
  expanded: boolean;
  onToggle: () => void;
  onTopicPress: (topic: CourseSyllabusTopic) => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const topicCount = unit.topics.length;
  const topicLabel = `${topicCount} Topic${topicCount === 1 ? '' : 's'}`;

  return (
    <View style={[styles.unitBlock, { borderBottomColor: theme.colors.border }]}>
      <TouchableOpacity
        style={styles.unitHeader}
        onPress={onToggle}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${formatUnitLabel(unit)}, ${topicLabel}`}
      >
        <View style={styles.unitCopy}>
          <Text style={[styles.unitTitle, { color: theme.colors.text }]}>{formatUnitLabel(unit)}</Text>
          <Text style={[styles.unitMeta, { color: theme.colors.textSecondary }]}>{topicLabel}</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.textMuted} />
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.topicList}>
          {unit.topics.map((topic) => (
            <TouchableOpacity
              key={topic.id}
              style={[styles.topicRow, { borderTopColor: theme.colors.border }]}
              onPress={() => onTopicPress(topic)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={topic.title}
            >
              <Text style={[styles.topicTitle, { color: theme.colors.text }]}>{topic.title}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function TopicAttachmentsModal({
  topic,
  onClose,
  theme,
}: {
  topic: CourseSyllabusTopic | null;
  onClose: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const attachments = topic?.attachments ?? [];

  return (
    <Modal visible={!!topic} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalSheet, { backgroundColor: theme.colors.card }]} onPress={(event) => event.stopPropagation()}>
          <View style={[styles.modalHandle, { backgroundColor: theme.colors.border }]} />
          <Text style={[styles.modalTitle, { color: theme.colors.text }]} numberOfLines={2}>
            {topic?.title}
          </Text>
          <Text style={[styles.modalSub, { color: theme.colors.textSecondary }]}>Attachments</Text>

          {attachments.length === 0 ? (
            <View style={[styles.emptyAttachments, { backgroundColor: theme.colors.slate100 }]}>
              <Ionicons name="folder-open-outline" size={28} color={theme.colors.textMuted} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No attachments for this topic yet.</Text>
            </View>
          ) : (
            attachments.map((attachment) => (
              <TouchableOpacity
                key={attachment.id}
                style={[styles.attachmentRow, { borderColor: theme.colors.border }]}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={attachment.title}
              >
                <View style={[styles.attachmentIcon, { backgroundColor: theme.colors.primaryLight }]}>
                  <Ionicons name={ATTACHMENT_ICONS[attachment.type]} size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.attachmentCopy}>
                  <Text style={[styles.attachmentTitle, { color: theme.colors.text }]}>{attachment.title}</Text>
                  {attachment.fileName ? (
                    <Text style={[styles.attachmentMeta, { color: theme.colors.textSecondary }]}>
                      {attachment.fileName}
                      {attachment.size ? ` · ${attachment.size}` : ''}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="download-outline" size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            ))
          )}

          <TouchableOpacity style={[styles.closeBtn, { backgroundColor: theme.colors.primaryLight }]} onPress={onClose}>
            <Text style={[styles.closeBtnText, { color: theme.colors.primary }]}>Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 32 },
  unitBlock: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  unitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 12,
  },
  unitCopy: { flex: 1 },
  unitTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 21,
  },
  unitMeta: {
    fontSize: 13,
    marginTop: 4,
  },
  topicList: {
    paddingBottom: 8,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingLeft: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  topicTitle: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 10,
    maxHeight: '72%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 24,
  },
  modalSub: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 14,
  },
  emptyAttachments: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 14,
    gap: 10,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  attachmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentCopy: { flex: 1 },
  attachmentTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  attachmentMeta: {
    fontSize: 12,
    marginTop: 3,
  },
  closeBtn: {
    marginTop: 6,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
