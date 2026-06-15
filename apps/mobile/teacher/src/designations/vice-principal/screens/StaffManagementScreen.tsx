import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { VicePrincipalHeader } from '../components/VicePrincipalHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import { staffMembers } from '../data/mockData';
import { spacing, textStyle, useThemedStyles, useVicePrincipalTheme } from '../theme';
import type { VicePrincipalColorScheme } from '../theme/colors';

export function StaffManagementScreen() {
  const navigation = useNavigation();
  const { colors } = useVicePrincipalTheme();
  const styles = useThemedStyles(createStyles);
  const [query, setQuery] = useState('');
  const visible = staffMembers.filter((s) => !query || s.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <ScreenShell header={<VicePrincipalHeader variant="back" title="Staff Management" onBack={() => navigation.goBack()} onFilter={() => {}} />}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.search}>
          <MaterialIcons name="search" size={20} color={colors.onSurfaceVariant} />
          <TextInput style={styles.input} placeholder="Search staff..." placeholderTextColor={colors.outline} value={query} onChangeText={setQuery} />
        </View>
        <Text style={styles.section}>Teaching Staff ({visible.length})</Text>
        {visible.map((s) => (
          <Card key={s.id} style={styles.card}>
            <Text style={styles.name}>{s.name}</Text>
            <Text style={styles.meta}>{s.dept} · {s.idNo}</Text>
            <Text style={[styles.status, s.status === 'present' ? styles.present : styles.leave]}>{s.status === 'present' ? 'Present' : 'On Leave'}</Text>
          </Card>
        ))}
      </ScrollView>
    </ScreenShell>
  );
}

function createStyles(colors: VicePrincipalColorScheme) {
  return StyleSheet.create({
    content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 32 },
    search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.surfaceContainerLow },
    input: { ...textStyle('bodyMd'), flex: 1, color: colors.onSurface, padding: 0 },
    section: { ...textStyle('headlineMd'), color: colors.onSurface },
    card: { gap: 4 },
    name: { ...textStyle('titleLg'), color: colors.onSurface },
    meta: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
    status: { ...textStyle('labelMd'), fontWeight: '700', marginTop: 4 },
    present: { color: colors.primary },
    leave: { color: colors.tertiary },
  });
}
