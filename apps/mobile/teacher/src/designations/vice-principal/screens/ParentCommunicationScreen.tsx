import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { VicePrincipalHeader } from '../components/VicePrincipalHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import { spacing, textStyle, useThemedStyles } from '../theme';
import type { VicePrincipalColorScheme } from '../theme/colors';

const messages = [
  { parent: 'Mrs. Ananya Verma', student: 'Aryan V. (9A)', topic: 'Academic Progress', time: '2 hours ago' },
  { parent: 'Mr. Suresh Patel', student: 'Riya S. (8B)', topic: 'Attendance Concern', time: 'Yesterday' },
  { parent: 'Dr. Kavitha Nair', student: 'Aditya K. (10A)', topic: 'Discipline Follow-up', time: '2 days ago' },
];

export function ParentCommunicationScreen() {
  const navigation = useNavigation();
  const styles = useThemedStyles(createStyles);

  return (
    <ScreenShell header={<VicePrincipalHeader variant="back" title="Parent Communication" onBack={() => navigation.goBack()} />}>
      <ScrollView contentContainerStyle={styles.content}>
        {messages.map((m) => (
          <Card key={m.parent} style={styles.card}>
            <Text style={styles.parent}>{m.parent}</Text>
            <Text style={styles.student}>{m.student}</Text>
            <Text style={styles.topic}>{m.topic}</Text>
            <Text style={styles.time}>{m.time}</Text>
          </Card>
        ))}
      </ScrollView>
    </ScreenShell>
  );
}

function createStyles(colors: VicePrincipalColorScheme) {
  return StyleSheet.create({
    content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 32 },
    card: { gap: 4 },
    parent: { ...textStyle('bodyMd'), fontWeight: '700', color: colors.onSurface },
    student: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
    topic: { ...textStyle('labelMd'), color: colors.primary, fontWeight: '600' },
    time: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  });
}
