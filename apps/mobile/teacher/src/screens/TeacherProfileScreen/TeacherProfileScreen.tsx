import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppIcon, ScreenLayout } from '@/components';
import { getRoleConfig } from '@/config/roleConfig';
import { mockApi } from '@/services/api';
import { useAuthStore } from '@/store';
import type { StaffUser } from '@/types';
import type { RootStackParamList } from '@/types';
import { colors, textStyle } from '@/theme';
import { handleBottomNavPress } from '@/utils/navigationHelpers';
import { styles } from './TeacherProfileScreen.styles';

const SETTINGS_ITEMS = [
  { icon: 'lock', label: 'Change Password', route: 'ChangePassword' as const },
  { icon: 'event_busy', label: 'Leave Balance', route: 'LeaveBalance' as const },
  { icon: 'payments', label: 'Salary', route: 'SalaryOverview' as const },
  { icon: 'settings', label: 'Settings', route: 'TeacherSettings' as const },
] as const;

function buildProfileBadges(user: StaffUser | null): string[] {
  if (!user) return [];
  const badges: string[] = [];
  if (user.employeeId) badges.push(`EMP: ${user.employeeId}`);
  if (user.className) badges.push(`${user.role} · ${user.className}`);
  else badges.push(user.role);
  if (user.department) badges.push(user.department);
  return badges;
}

function buildProfessionalRows(user: StaffUser | null) {
  return [
    { icon: 'school', label: 'Qualification', value: user?.designation === 'teacher' ? 'M.Sc Mathematics' : 'M.Ed Administration' },
    { icon: 'work', label: 'Designation', value: user?.role ?? 'Staff' },
    { icon: 'calendar_month', label: 'Joining Date', value: '01 Aug 2019' },
    { icon: 'grade', label: 'Experience', value: '7 Years' },
    { icon: 'subject', label: 'Department', value: user?.department ?? '—' },
  ] as const;
}

function buildPersonalRows(user: StaffUser | null) {
  return [
    { icon: 'wc', label: 'Gender', value: 'Female' },
    { icon: 'cake', label: 'Date of Birth', value: '12 Mar 1985' },
    { icon: 'call', label: 'Mobile', value: '+91 98765 43210' },
    { icon: 'mail', label: 'Email', value: user?.email ?? '—' },
    { icon: 'home', label: 'Address', value: '123, Academic Block, Green Valley, New Delhi' },
  ] as const;
}

function CollapsibleInfoSection({
  title,
  rows,
  defaultExpanded = false,
}: {
  title: string;
  rows: readonly { icon: string; label: string; value: string }[];
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.infoCard}>
      <TouchableOpacity
        style={styles.infoHeader}
        onPress={() => setExpanded((open) => !open)}
        activeOpacity={0.7}
      >
        <Text style={[textStyle('chip10'), styles.cardSectionTitleInline]}>{title}</Text>
        <AppIcon name={expanded ? 'expand_less' : 'expand_more'} size={24} color={colors.primaryContainer} />
      </TouchableOpacity>
      {expanded
        ? rows.map((row, index) => (
            <View
              key={row.label}
              style={[styles.infoRow, index === rows.length - 1 && styles.infoRowLast]}
            >
              <View style={styles.infoIconBox}>
                <AppIcon name={row.icon} size={22} color={colors.primaryContainer} />
              </View>
              <View style={styles.infoTextCol}>
                <Text style={[textStyle('labelSm'), styles.infoLabel]}>{row.label}</Text>
                <Text style={[textStyle('bodyMd'), styles.infoValue]}>{row.value}</Text>
              </View>
            </View>
          ))
        : null}
    </View>
  );
}

export function TeacherProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const authUser = useAuthStore((s) => s.user);
  const updateAvatar = useAuthStore((s) => s.updateAvatar);
  const setUser = useAuthStore((s) => s.setUser);
  const [avatarUrl, setAvatarUrl] = useState(authUser?.avatarUrl ?? '');
  const [teacherName, setTeacherName] = useState(authUser?.name ?? 'Staff');
  const [uploading, setUploading] = useState(false);
  const roleConfig = authUser ? getRoleConfig(authUser.designation) : null;
  const visibleSettings = SETTINGS_ITEMS.filter((item) =>
    roleConfig?.profileSettingsRoutes.includes(item.route),
  );
  const profileBadges = buildProfileBadges(authUser);
  const personalRows = buildPersonalRows(authUser);
  const professionalRows = buildProfessionalRows(authUser);

  useFocusEffect(
    useCallback(() => {
      mockApi.teacher.getProfile().then((teacher) => {
        setAvatarUrl(teacher.avatarUrl);
        setTeacherName(teacher.name);
        setUser(teacher);
      });
    }, [setUser]),
  );

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to update your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const uri = result.assets[0].uri;
      await updateAvatar(uri);
      setAvatarUrl(uri);
    } catch {
      Alert.alert('Upload failed', 'Could not update your profile photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScreenLayout
      scroll
      paddingBottom={120}
      bottomNav={{
        activeTab: 'profile',
        onTabPress: (tab) => handleBottomNavPress(navigation, tab),
      }}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <AppIcon name="arrow_back" color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[textStyle('labelLg'), styles.headerTitle]}>MY PROFILE</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('FacultyMenu')}>
          <AppIcon name="menu_book" color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <TouchableOpacity style={styles.avatarWrap} onPress={pickImage} activeOpacity={0.85} disabled={uploading}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
            <View style={styles.cameraBtn}>
              {uploading ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <AppIcon name="photo_camera" size={20} color={colors.onPrimary} filled />
              )}
            </View>
          </TouchableOpacity>
          <Text style={[textStyle('headlineLg'), styles.name]}>{teacherName}</Text>
          <View style={styles.badges}>
            {profileBadges.map((badge) => (
              <View key={badge} style={styles.badge}>
                <Text style={[textStyle('labelSmMobile'), styles.badgeText]}>{badge}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionPrimary}
            onPress={() => navigation.navigate('MessagesList')}
          >
            <AppIcon name="chat" size={18} color={colors.onPrimary} />
            <Text style={[textStyle('labelLg'), styles.actionPrimaryText]}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionOutline}
            onPress={() => navigation.navigate('ClassTimetable')}
          >
            <AppIcon name="calendar_today" size={18} color={colors.primaryContainer} />
            <Text style={[textStyle('labelLg'), styles.actionOutlineText]}>Schedule</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsCard}>
          <Text style={[textStyle('chip10'), styles.cardSectionTitle]}>ACCOUNT & SETTINGS</Text>
          {visibleSettings.map((item, index) => (
            <TouchableOpacity
              key={item.route}
              style={[styles.settingsRow, index < visibleSettings.length - 1 && styles.settingsRowBorder]}
              onPress={() => navigation.navigate(item.route)}
              activeOpacity={0.7}
            >
              <View style={styles.settingsIconBox}>
                <AppIcon name={item.icon} size={22} color={colors.primaryContainer} />
              </View>
              <Text style={[textStyle('labelLg'), styles.settingsLabel]}>{item.label}</Text>
              <AppIcon name="chevron_right" size={22} color={colors.outline} />
            </TouchableOpacity>
          ))}
        </View>

        <CollapsibleInfoSection title="PERSONAL INFO" rows={personalRows} />
        <CollapsibleInfoSection title="PROFESSIONAL INFO" rows={professionalRows} />

        <View style={styles.footer}>
          <Text style={[textStyle('headlineSm'), styles.footerBrand]}>IDPS</Text>
          <Text style={[textStyle('labelSm'), styles.footerCopy]}>
            © 2024 International Delhi Public School. Secure Staff Access.
          </Text>
          <View style={styles.footerLinks}>
            <Text style={[textStyle('labelSm'), styles.footerLink]}>Privacy Policy</Text>
            <Text style={[textStyle('labelSm'), styles.footerLink]}>Support</Text>
            <Text style={[textStyle('labelSm'), styles.footerLink]}>Terms</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
