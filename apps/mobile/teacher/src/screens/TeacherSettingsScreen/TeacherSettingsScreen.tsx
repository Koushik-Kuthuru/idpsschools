import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader, ScreenLayout } from '@/components';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store';
import type { RootStackParamList } from '@/types';
import { colors, textStyle } from '@/theme';
import { styles } from './TeacherSettingsScreen.styles';
import type { TeacherSettingsScreenProps } from './TeacherSettingsScreen.types';

export function TeacherSettingsScreen(_props: TeacherSettingsScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useAppStore((s) => s.setNotificationsEnabled);
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const logout = useAuthStore((s) => s.logout);

  return (
    <ScreenLayout scroll header={<AppHeader variant="back" title="Settings" />}>
      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={[textStyle('bodyMd'), styles.rowLabel]}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ true: colors.primaryContainer, false: colors.slate200 }}
            />
          </View>
          <View style={styles.row}>
            <Text style={[textStyle('bodyMd'), styles.rowLabel]}>Dark mode</Text>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ true: colors.primaryContainer, false: colors.slate200 }}
            />
          </View>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('ChangePassword')}>
            <Text style={[textStyle('bodyMd'), styles.rowLabel]}>Change password</Text>
            <Text style={[textStyle('labelLg'), styles.linkText]}>Open</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.row, styles.rowLast]}
            onPress={() => navigation.navigate('OfflineModeIndicator')}
          >
            <Text style={[textStyle('bodyMd'), styles.rowLabel]}>Offline mode</Text>
            <Text style={[textStyle('labelLg'), styles.linkText]}>View</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.section}
          onPress={async () => {
            await logout();
            navigation.getParent()?.goBack();
          }}
        >
          <View style={[styles.row, styles.rowLast]}>
            <Text style={[textStyle('labelLg'), styles.dangerText]}>Log out</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}
