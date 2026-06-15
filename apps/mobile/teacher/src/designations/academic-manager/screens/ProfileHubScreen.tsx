import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ManagerHeader } from '../components/ManagerHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import { managerAvatar } from '../data/mockData';
import { getManagerUnreadCount, useManagerNotificationsStore } from '../store/managerNotificationsStore';
import { handleManagerTabPress } from '../navigation/navigationHelpers';
import type { ManagerStackParamList } from '../navigation/types';
import { SCHOOL_NAME } from '@/constants/school';
import { colors, spacing, textStyle } from '@/designations/academic-manager/theme';
import { Image } from 'expo-image';

const MENU: { icon: keyof typeof MaterialIcons.glyphMap; label: string; sub: string; route: keyof ManagerStackParamList }[] = [
  { icon: 'folder', label: 'Academic Records', sub: 'TC, promotion, transfer', route: 'AcademicRecords' },
  { icon: 'menu-book', label: 'Curriculum Tracker', sub: '72% overall progress', route: 'CurriculumTracker' },
  { icon: 'groups', label: 'Staff Coordination', sub: '51 staff today', route: 'StaffCoordination' },
  { icon: 'campaign', label: 'Parent Communications', sub: '12 sent this month', route: 'ParentCommunications' },
  { icon: 'notifications', label: 'Notifications', sub: '', route: 'NotificationsAlerts' },
  { icon: 'analytics', label: 'Reports & Analytics', sub: '87.4% pass rate', route: 'ReportsAnalytics' },
];

export function ProfileHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ManagerStackParamList>>();
  const notificationItems = useManagerNotificationsStore((s) => s.items);
  const unreadCount = getManagerUnreadCount(notificationItems);

  return (
    <ScreenShell
      activeTab="profile"
      onTabPress={(t) => handleManagerTabPress(navigation, t)}
      header={
        <ManagerHeader
          title=""
          identity={{
            orgTitle: 'Academic Manager',
            orgSubtitle: SCHOOL_NAME,
            notificationCount: unreadCount > 0 ? unreadCount : undefined,
            onNotifications: () => navigation.navigate('NotificationsAlerts'),
          }}
        />
      }
    >
      <View style={styles.content}>
        <Card style={styles.profileCard}>
          <Image source={{ uri: managerAvatar }} style={styles.avatar} />
          <View>
            <Text style={styles.name}>Aarav Mehta</Text>
            <Text style={styles.role}>Academic Administration Manager</Text>
            <Text style={styles.email}>academic.manager@idps.edu</Text>
          </View>
        </Card>
        {MENU.map((m) => {
          const sub =
            m.route === 'NotificationsAlerts'
              ? unreadCount > 0
                ? `${unreadCount} unread`
                : 'All caught up'
              : m.sub;
          return (
          <TouchableOpacity key={m.label} style={styles.menuItem} onPress={() => navigation.navigate(m.route)}>
            <View style={styles.menuIcon}><MaterialIcons name={m.icon} size={22} color={colors.primary} /></View>
            <View style={styles.menuBody}>
              <Text style={styles.menuLabel}>{m.label}</Text>
              <Text style={styles.menuSub}>{sub}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.outline} />
          </TouchableOpacity>
          );
        })}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.gutter, gap: 12 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  name: { ...textStyle('headlineMd') },
  role: { ...textStyle('bodyMd'), color: colors.primary, fontWeight: '600' },
  email: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLowest },
  menuIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: `${colors.primaryContainer}1a`, alignItems: 'center', justifyContent: 'center' },
  menuBody: { flex: 1 },
  menuLabel: { ...textStyle('bodyMd'), fontWeight: '600' },
  menuSub: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
});
