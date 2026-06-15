import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AcademicHeader } from '../components/AcademicHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import type { RootStackParamList } from '../navigation/types';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store';
import type { AcademicColorScheme } from '../theme/colors';
import { spacing, textStyle, useAcademicTheme, useThemedStyles } from '@/designations/academic-director/theme';

export function AcademicSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useAcademicTheme();
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useAppStore((s) => s.setNotificationsEnabled);
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const logout = useAuthStore((s) => s.logout);
  const styles = useThemedStyles(createStyles);

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleOfflineMode = () => {
    Alert.alert('Offline mode', 'Cached academic data is available for up to 24 hours without network.');
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Leave the Academic Director portal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <ScreenShell
      scroll
      header={
        <AcademicHeader title="Settings" onBack={() => navigation.goBack()} />
      }
    >
      <View style={styles.content}>
        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="notifications" size={22} color={colors.onSurfaceVariant} />
              <Text style={styles.rowText}>Push notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ true: colors.primaryContainer, false: colors.surfaceContainerHigh }}
              thumbColor={colors.onPrimary}
            />
          </View>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="dark-mode" size={22} color={colors.onSurfaceVariant} />
              <Text style={styles.rowText}>Dark mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ true: colors.primaryContainer, false: colors.surfaceContainerHigh }}
              thumbColor={colors.onPrimary}
            />
          </View>
        </Card>

        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <Card style={styles.card}>
          <TouchableOpacity style={styles.linkRow} onPress={handleChangePassword}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="lock" size={22} color={colors.onSurfaceVariant} />
              <Text style={styles.rowText}>Change password</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.outline} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.linkRow, styles.rowLast]} onPress={handleOfflineMode}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="cloud-off" size={22} color={colors.onSurfaceVariant} />
              <Text style={styles.rowText}>Offline mode</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.outline} />
          </TouchableOpacity>
        </Card>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <MaterialIcons name="logout" size={20} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScreenShell>
  );
}

function createStyles(colors: AcademicColorScheme) {
  return StyleSheet.create({
    content: { padding: spacing.gutter, gap: 12 },
    sectionLabel: { ...textStyle('chip10'), color: colors.slate400, letterSpacing: 2, marginTop: 4 },
    card: { padding: 0, overflow: 'hidden' },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    rowLast: { borderBottomWidth: 0 },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    rowText: { ...textStyle('bodyMd'), color: colors.onSurface },
    signOutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 8,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: `${colors.error}44`,
      backgroundColor: `${colors.error}12`,
    },
    signOutText: { ...textStyle('bodyMd'), color: colors.error, fontWeight: '600' },
  });
}
