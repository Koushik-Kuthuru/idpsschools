import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { VicePrincipalHeader } from '../components/VicePrincipalHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import { spacing, textStyle, useThemedStyles, useVicePrincipalTheme } from '../theme';
import type { VicePrincipalColorScheme } from '../theme/colors';

const facilities = [
  { icon: 'electrical-services' as const, label: 'Power & Utilities', status: 'Normal', detail: 'All zones operational' },
  { icon: 'plumbing' as const, label: 'Water Supply', status: 'Alert', detail: 'Block B pressure low' },
  { icon: 'local-fire-department' as const, label: 'Safety Systems', status: 'Normal', detail: 'Fire drills up to date' },
  { icon: 'cleaning-services' as const, label: 'Housekeeping', status: 'Normal', detail: '98% tasks completed' },
];

export function CampusOperationsScreen() {
  const navigation = useNavigation();
  const { colors } = useVicePrincipalTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <ScreenShell header={<VicePrincipalHeader variant="back" title="Campus Operations" onBack={() => navigation.goBack()} />}>
      <ScrollView contentContainerStyle={styles.content}>
        {facilities.map((f) => (
          <Card key={f.label} style={styles.card}>
            <View style={styles.row}>
              <MaterialIcons name={f.icon} size={24} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{f.label}</Text>
                <Text style={styles.detail}>{f.detail}</Text>
              </View>
              <Text style={[styles.status, f.status === 'Alert' ? styles.alert : styles.ok]}>{f.status}</Text>
            </View>
          </Card>
        ))}
      </ScrollView>
    </ScreenShell>
  );
}

function createStyles(colors: VicePrincipalColorScheme) {
  return StyleSheet.create({
    content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 32 },
    card: { gap: 8 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    title: { ...textStyle('bodyMd'), fontWeight: '700', color: colors.onSurface },
    detail: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
    status: { ...textStyle('chip10'), fontWeight: '700' },
    ok: { color: colors.primary },
    alert: { color: colors.tertiary },
  });
}
