import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { PrincipalHeader } from '../components/PrincipalHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import { principalProfile } from '../data/mockData';
import { getPrincipalUnreadCount, usePrincipalNotificationsStore } from '../store/principalNotificationsStore';
import { handlePrincipalTabPress } from '../navigation/navigationHelpers';
import type { PrincipalStackParamList } from '../navigation/types';
import { stitchImages } from '@/assets/images';
import { SCHOOL_NAME } from '@/constants/school';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store';
import { spacing, textStyle, usePrincipalTheme, useThemedStyles } from '@/designations/principal/theme';
import type { PrincipalColorScheme } from '@/designations/principal/theme/colors';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

const switchTrack = (colors: PrincipalColorScheme) => ({
  true: colors.primaryContainer,
  false: colors.surfaceContainerHigh,
});

export function ProfileHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PrincipalStackParamList>>();
  const { colors } = usePrincipalTheme();
  const styles = useThemedStyles(createStyles);
  const user = useAuthStore((s) => s.user);
  const updateAvatar = useAuthStore((s) => s.updateAvatar);
  const updateName = useAuthStore((s) => s.updateName);
  const logout = useAuthStore((s) => s.logout);
  const notificationItems = usePrincipalNotificationsStore((s) => s.items);
  const unreadCount = getPrincipalUnreadCount(notificationItems);
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useAppStore((s) => s.setNotificationsEnabled);
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);

  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [displayName, setDisplayName] = useState(user?.name ?? principalProfile.name);
  const [uploading, setUploading] = useState(false);
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'personal' | 'contact' | null>('personal');

  const p = principalProfile;
  const email = user?.email ?? p.email;
  const photoUri = avatarUrl || stitchImages.teacherAvatar;

  useEffect(() => {
    if (user?.avatarUrl) setAvatarUrl(user.avatarUrl);
  }, [user?.avatarUrl]);

  useEffect(() => {
    if (user?.name) setDisplayName(user.name);
  }, [user?.name]);

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

  const openNameEditor = () => {
    setNameDraft(displayName);
    setNameModalOpen(true);
  };

  const saveName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter your display name.');
      return;
    }

    setSavingName(true);
    try {
      await updateName(trimmed);
      setDisplayName(trimmed);
      setNameModalOpen(false);
    } catch {
      Alert.alert('Update failed', 'Could not save your name. Please try again.');
    } finally {
      setSavingName(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Leave the Principal portal?', [
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

  const handleCall = () => {
    Linking.openURL(`tel:${p.phone.replace(/\s/g, '')}`).catch(() => {
      Alert.alert('Call', p.phone);
    });
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Email', email);
    });
  };

  const toggleSection = (key: 'personal' | 'contact') => {
    setExpandedSection((prev) => (prev === key ? null : key));
  };

  return (
    <ScreenShell
      activeTab="profile"
      onTabPress={(t) => handlePrincipalTabPress(navigation, t)}
      header={
        <PrincipalHeader
          title=""
          identity={{
            orgTitle: 'My Profile',
            orgSubtitle: SCHOOL_NAME,
            notificationCount: unreadCount > 0 ? unreadCount : undefined,
            onNotifications: () => navigation.navigate('Notifications'),
          }}
        />
      }
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.profileCard}>
          <TouchableOpacity style={styles.avatarWrap} onPress={pickImage} activeOpacity={0.85}>
            <Image source={{ uri: photoUri }} style={styles.avatar} contentFit="cover" />
            <View style={styles.cameraBadge}>
              {uploading ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <MaterialIcons name="photo-camera" size={16} color={colors.onPrimary} />
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <TouchableOpacity style={styles.nameRow} onPress={openNameEditor} activeOpacity={0.7}>
              <Text style={styles.profileName} numberOfLines={2}>
                {displayName}
              </Text>
              <MaterialIcons name="edit" size={18} color={colors.primaryContainer} />
            </TouchableOpacity>
            <Text style={styles.profileRole}>{p.role}</Text>
            <Text style={styles.profileEmail}>{email}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{p.empId}</Text>
              </View>
            </View>
            <Text style={styles.photoHint}>Tap photo to change · tap name to edit</Text>
          </View>
        </Card>

        <Text style={styles.sectionLabel}>PROFILE DETAILS</Text>

        <Card style={styles.accordionCard}>
          <AccordionHead
            icon="person"
            title="Personal Info"
            open={expandedSection === 'personal'}
            onPress={() => toggleSection('personal')}
          />
          {expandedSection === 'personal' ? (
            <View style={styles.accordionBody}>
              <InfoRow icon="cake" label="DOB" value={p.dob} />
              <InfoRow icon="wc" label="Gender" value={p.gender} />
              <InfoRow icon="bloodtype" label="Blood Group" value={p.bloodGroup} />
              <InfoRow icon="flag" label="Nationality" value={p.nationality} />
              <InfoRow icon="school" label="Qualification" value={p.qualification} />
            </View>
          ) : null}
        </Card>

        <Card style={styles.accordionCard}>
          <AccordionHead
            icon="contact-phone"
            title="Contact Details"
            open={expandedSection === 'contact'}
            onPress={() => toggleSection('contact')}
          />
          {expandedSection === 'contact' ? (
            <View style={styles.accordionBody}>
              <TouchableOpacity onPress={handleCall} activeOpacity={0.7}>
                <InfoRow icon="phone" label="Phone" value={p.phone} action />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEmail} activeOpacity={0.7}>
                <InfoRow icon="email" label="Email" value={email} action />
              </TouchableOpacity>
              <InfoRow icon="home" label="Address" value={p.address} multiline />
            </View>
          ) : null}
        </Card>

        <Text style={styles.sectionLabel}>SETTINGS</Text>
        <Card style={styles.settingsCard}>
          <SettingRow
            icon="notifications"
            label="Push Notifications"
            isLast={false}
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={switchTrack(colors)}
                thumbColor={colors.onPrimary}
              />
            }
          />
          <SettingRow
            icon="dark-mode"
            label="Dark Mode"
            isLast={false}
            right={
              <Switch
                value={darkMode}
                onValueChange={toggleDarkMode}
                trackColor={switchTrack(colors)}
                thumbColor={colors.onPrimary}
              />
            }
          />
          <TouchableOpacity
            style={styles.settingsLink}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <MaterialIcons name="lock" size={20} color={colors.onSurfaceVariant} />
            <Text style={styles.settingsLinkText}>Change Password</Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
          </TouchableOpacity>
        </Card>

        <TouchableOpacity style={styles.signOut} onPress={handleSignOut} activeOpacity={0.8}>
          <MaterialIcons name="logout" size={20} color={colors.dangerText} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={nameModalOpen} transparent animationType="fade" onRequestClose={() => setNameModalOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setNameModalOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Edit Name</Text>
            <TextInput
              style={styles.nameInput}
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Your display name"
              placeholderTextColor={colors.outline}
              autoFocus
              maxLength={60}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setNameModalOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveName} disabled={savingName}>
                {savingName ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenShell>
  );
}

function AccordionHead({
  icon,
  title,
  open,
  onPress,
}: {
  icon: IconName;
  title: string;
  open: boolean;
  onPress: () => void;
}) {
  const { colors } = usePrincipalTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <TouchableOpacity style={styles.accordionHead} onPress={onPress} activeOpacity={0.7}>
      <MaterialIcons name={icon} size={20} color={colors.primary} />
      <Text style={styles.accordionTitle}>{title}</Text>
      <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={22} color={colors.onSurfaceVariant} />
    </TouchableOpacity>
  );
}

function InfoRow({
  icon,
  label,
  value,
  action,
  multiline,
}: {
  icon: IconName;
  label: string;
  value: string;
  action?: boolean;
  multiline?: boolean;
}) {
  const { colors } = usePrincipalTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.infoRow}>
      <MaterialIcons name={icon} size={18} color={colors.onSurfaceVariant} />
      <Text style={styles.infoLbl}>{label}</Text>
      <Text
        style={[styles.infoVal, action && styles.infoAction, multiline && styles.infoMultiline]}
        numberOfLines={multiline ? 3 : 1}
      >
        {value}
      </Text>
      {action ? <MaterialIcons name="open-in-new" size={16} color={colors.primary} /> : null}
    </View>
  );
}

function SettingRow({
  icon,
  label,
  right,
  isLast = true,
}: {
  icon: IconName;
  label: string;
  right?: React.ReactNode;
  isLast?: boolean;
}) {
  const { colors } = usePrincipalTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.settingRow, isLast && styles.settingRowLast]}>
      <MaterialIcons name={icon} size={20} color={colors.onSurfaceVariant} />
      <Text style={styles.settingLbl}>{label}</Text>
      {right}
    </View>
  );
}

function createStyles(colors: PrincipalColorScheme) {
  return StyleSheet.create({
    content: { padding: spacing.gutter, gap: 10, paddingBottom: 32 },
    profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    avatarWrap: { position: 'relative' },
    avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.surfaceContainerHigh },
    cameraBadge: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.surfaceContainerLowest,
    },
    profileInfo: { flex: 1, gap: 2 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    profileName: { ...textStyle('headlineMd'), fontWeight: '700', flex: 1, color: colors.onSurface },
    profileRole: { ...textStyle('bodyMd'), color: colors.primaryContainer, fontWeight: '600' },
    profileEmail: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: `${colors.primaryContainer}18`,
    },
    badgeText: { ...textStyle('chip10'), color: colors.primary, fontWeight: '700' },
    photoHint: { ...textStyle('chip10'), color: colors.onSurfaceVariant, marginTop: 4 },
    sectionLabel: {
      ...textStyle('chip10'),
      color: colors.onSurfaceVariant,
      letterSpacing: 1.5,
      marginTop: 8,
      marginBottom: 2,
      fontWeight: '700',
    },
    accordionCard: { padding: 0, overflow: 'hidden' },
    accordionHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    accordionTitle: { ...textStyle('bodyMd'), fontWeight: '700', flex: 1, color: colors.onSurface },
    accordionBody: { paddingHorizontal: 16, paddingBottom: 14, gap: 6 },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 6,
    },
    infoLbl: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, width: 88 },
    infoVal: { ...textStyle('bodyMd'), fontWeight: '500', flex: 1, textAlign: 'right', color: colors.onSurface },
    infoAction: { color: colors.primary, fontWeight: '600' },
    infoMultiline: { textAlign: 'left' },
    settingsCard: { padding: 0, overflow: 'hidden' },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      minHeight: 56,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    settingRowLast: { borderBottomWidth: 0 },
    settingLbl: { ...textStyle('bodyMd'), flex: 1, color: colors.onSurface },
    settingsLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      minHeight: 56,
    },
    settingsLinkText: { ...textStyle('bodyMd'), flex: 1, color: colors.primary, fontWeight: '600' },
    signOut: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 8,
      padding: 14,
      borderRadius: 12,
      backgroundColor: colors.dangerBg,
    },
    signOutText: { ...textStyle('bodyMd'), color: colors.dangerText, fontWeight: '700' },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      padding: spacing.gutter,
    },
    modalCard: {
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: 16,
      padding: 20,
      gap: 12,
    },
    modalTitle: { ...textStyle('titleLg'), fontWeight: '700', color: colors.onSurface },
    nameInput: {
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      ...textStyle('bodyMd'),
      color: colors.onSurface,
      backgroundColor: colors.surfaceContainerLow,
    },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    cancelBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      alignItems: 'center',
    },
    cancelText: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, fontWeight: '600' },
    saveBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: colors.primaryContainer,
      alignItems: 'center',
    },
    saveText: { ...textStyle('bodyMd'), color: colors.onPrimary, fontWeight: '700' },
  });
}
