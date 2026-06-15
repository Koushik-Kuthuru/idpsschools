import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AcademicHeader } from '../components/AcademicHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import { getAcademicUnreadCount, useAcademicNotificationsStore } from '../store/notificationsStore';
import { handleAcademicTabPress } from '../navigation/navigationHelpers';
import type { RootStackParamList } from '../navigation/types';
import { stitchImages } from '@/assets/images';
import { SCHOOL_NAME } from '@/constants/school';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store';
import type { AcademicColorScheme } from '../theme/colors';
import { spacing, textStyle, useAcademicTheme, useThemedStyles } from '@/designations/academic-director/theme';

export function ProfileHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore((s) => s.user);
  const updateAvatar = useAuthStore((s) => s.updateAvatar);
  const updateName = useAuthStore((s) => s.updateName);
  const logout = useAuthStore((s) => s.logout);
  const notificationItems = useAcademicNotificationsStore((s) => s.items);
  const unreadCount = getAcademicUnreadCount(notificationItems);
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const { colors } = useAcademicTheme();
  const styles = useThemedStyles(createStyles);

  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [displayName, setDisplayName] = useState(user?.name ?? 'Academic Director');
  const [uploading, setUploading] = useState(false);
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (user?.avatarUrl) setAvatarUrl(user.avatarUrl);
  }, [user?.avatarUrl]);

  useEffect(() => {
    if (user?.name) setDisplayName(user.name);
  }, [user?.name]);

  const email = user?.email ?? 'academic.director@idps.edu';
  const photoUri = avatarUrl || stitchImages.loginLogo;

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
      activeTab="profile"
      onTabPress={(t) => handleAcademicTabPress(navigation, t)}
      header={
        <AcademicHeader
          title=""
          identity={{
            orgTitle: 'Academic Director',
            orgSubtitle: SCHOOL_NAME,
            onNotifications: () => navigation.navigate('Notifications'),
            notificationCount: unreadCount > 0 ? unreadCount : undefined,
          }}
        />
      }
    >
      <View style={styles.content}>
        <Card style={styles.profileCard}>
          <TouchableOpacity style={styles.avatarWrap} onPress={pickImage} activeOpacity={0.85}>
            <Image source={{ uri: photoUri }} style={styles.profilePhoto} contentFit="cover" />
            <View style={[styles.cameraBadge, { backgroundColor: colors.primaryContainer }]}>
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
            <Text style={styles.profileRole}>Academic Director</Text>
            <Text style={styles.profileEmail}>{email}</Text>
            <Text style={styles.changePhotoHint}>Tap photo to change · tap name to edit</Text>
          </View>
        </Card>

        <Text style={styles.sectionLabel}>QUICK SETTINGS</Text>
        <Card style={styles.settingsCard}>
          <View style={styles.settingsRow}>
            <MaterialIcons name="dark-mode" size={22} color={colors.onSurfaceVariant} />
            <Text style={styles.settingsText}>Dark Mode</Text>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ true: colors.primaryContainer, false: colors.surfaceContainerHigh }}
              thumbColor={colors.onPrimary}
            />
          </View>
          <TouchableOpacity style={styles.settingsRow} onPress={() => navigation.navigate('Settings')}>
            <MaterialIcons name="settings" size={22} color={colors.onSurfaceVariant} />
            <Text style={styles.settingsText}>Settings</Text>
            <MaterialIcons name="chevron-right" size={22} color={colors.outline} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingsRow, styles.settingsRowLast]} onPress={handleSignOut}>
            <MaterialIcons name="logout" size={22} color={colors.error} />
            <Text style={[styles.settingsText, { color: colors.error }]}>Sign Out</Text>
          </TouchableOpacity>
        </Card>
      </View>

      <Modal visible={nameModalOpen} transparent animationType="fade" onRequestClose={() => setNameModalOpen(false)}>
        <Pressable style={styles.nameModalBackdrop} onPress={() => setNameModalOpen(false)}>
          <Pressable style={styles.nameModalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.nameModalTitle}>Edit Name</Text>
            <TextInput
              style={styles.nameInput}
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Your display name"
              placeholderTextColor={colors.outline}
              autoFocus
              maxLength={60}
            />
            <View style={styles.nameModalActions}>
              <TouchableOpacity style={styles.nameCancelBtn} onPress={() => setNameModalOpen(false)}>
                <Text style={styles.nameCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nameSaveBtn} onPress={saveName} disabled={savingName}>
                {savingName ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Text style={styles.nameSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenShell>
  );
}

function createStyles(colors: AcademicColorScheme) {
  return StyleSheet.create({
    content: { padding: spacing.gutter, gap: 12 },
    profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    avatarWrap: { position: 'relative' },
    profilePhoto: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surfaceContainerHigh },
    cameraBadge: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.surfaceContainerLowest,
    },
    profileInfo: { flex: 1, gap: 2 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    profileName: { ...textStyle('headlineMd'), color: colors.onSurface, flex: 1 },
    profileRole: { ...textStyle('bodyMd'), color: colors.primaryContainer, fontWeight: '600' },
    profileEmail: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, marginTop: 2 },
    changePhotoHint: { ...textStyle('chip10'), color: colors.slate400, marginTop: 4 },
    sectionLabel: { ...textStyle('chip10'), color: colors.slate400, letterSpacing: 2, marginTop: 8 },
    settingsCard: { padding: 0, overflow: 'hidden' },
    settingsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    settingsRowLast: { borderBottomWidth: 0 },
    settingsText: { ...textStyle('bodyMd'), flex: 1, color: colors.onSurface },
    nameModalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      padding: spacing.gutter,
    },
    nameModalCard: {
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: 16,
      padding: 20,
      gap: 12,
    },
    nameModalTitle: { ...textStyle('titleLg'), fontWeight: '700', color: colors.onSurface },
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
    nameModalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    nameCancelBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      alignItems: 'center',
    },
    nameCancelText: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, fontWeight: '600' },
    nameSaveBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: colors.primaryContainer,
      alignItems: 'center',
    },
    nameSaveText: { ...textStyle('bodyMd'), color: colors.onPrimary, fontWeight: '700' },
  });
}
