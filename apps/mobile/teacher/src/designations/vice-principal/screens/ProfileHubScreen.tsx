import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { VicePrincipalHeader } from '../components/VicePrincipalHeader';
import { ScreenShell } from '../components/ScreenShell';
import { vpProfile } from '../data/mockData';
import { handleVpTabPress } from '../navigation/navigationHelpers';
import type { VicePrincipalStackParamList } from '../navigation/types';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store';
import { spacing, textStyle, useThemedStyles, useVicePrincipalTheme } from '../theme';
import type { VicePrincipalColorScheme } from '../theme/colors';

export function ProfileHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<VicePrincipalStackParamList>>();
  const { colors } = useVicePrincipalTheme();
  const styles = useThemedStyles(createStyles);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useAppStore((s) => s.setNotificationsEnabled);
  const [leaveAlerts, setLeaveAlerts] = useState(true);
  const [disciplineAlerts, setDisciplineAlerts] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);

  const displayName = user?.name ?? vpProfile.name;
  const email = user?.email ?? vpProfile.email;

  return (
    <ScreenShell
      activeTab="profile"
      onTabPress={(t) => handleVpTabPress(navigation, t)}
      header={
        <VicePrincipalHeader
          variant="brand"
          title="Profile & Settings"
          actionIcon="edit"
          onAction={() => Alert.alert('Edit', 'Edit profile')}
        />
      }
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[colors.primaryContainer, colors.gradientEnd]} style={styles.hero}>
          <View style={styles.heroRow}>
            <View style={styles.initialsCircle}>
              <Text style={styles.initials}>VP</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>{displayName}</Text>
              <Text style={styles.heroRole}>{vpProfile.role}</Text>
              <Text style={styles.heroSchool}>{vpProfile.school}</Text>
              <View style={styles.empBadge}>
                <Text style={styles.empText}>{vpProfile.empId}</Text>
              </View>
            </View>
          </View>
          <View style={styles.heroStats}>
            <HeroStat label="Experience" value={vpProfile.experience} />
            <View style={styles.divider} />
            <HeroStat label="Degree" value={vpProfile.degree} />
            <View style={styles.divider} />
            <HeroStat label="Joined" value={vpProfile.joined} />
          </View>
        </LinearGradient>

        <View style={styles.bentoGrid}>
          <View style={styles.bentoCard}>
            <View style={styles.bentoHead}>
              <MaterialIcons name="contact-page" size={20} color={colors.primary} />
              <Text style={styles.bentoLbl}>CONTACT</Text>
            </View>
            <Text style={styles.bentoVal}>{vpProfile.phone}</Text>
            <Text style={styles.bentoSub}>{email}</Text>
          </View>
          <View style={styles.bentoCard}>
            <View style={styles.bentoHead}>
              <MaterialIcons name="work" size={20} color="#2563eb" />
              <Text style={styles.bentoLbl}>WORK</Text>
            </View>
            <Text style={styles.bentoVal}>{vpProfile.workLocation}</Text>
            <Text style={styles.bentoSub}>{vpProfile.workHours}</Text>
          </View>
        </View>

        <Text style={styles.section}>Account</Text>
        <View style={styles.settingsCard}>
          <SettingsLink icon="person" label="Edit Profile" />
          <SettingsLink icon="lock" label="Change Password" onPress={() => navigation.navigate('ChangePassword')} />
          <SettingToggle icon="verified-user" label="Two-Factor Auth" value={twoFactor} onChange={setTwoFactor} />
        </View>

        <Text style={styles.section}>Notifications</Text>
        <View style={styles.settingsCard}>
          <SettingToggle label="Push Notifications" value={notificationsEnabled} onChange={setNotificationsEnabled} />
          <SettingToggle label="Leave Alerts" value={leaveAlerts} onChange={setLeaveAlerts} />
          <SettingToggle label="Discipline Alerts" value={disciplineAlerts} onChange={setDisciplineAlerts} />
          <View style={styles.digestRow}>
            <Text style={styles.settingLbl}>Parent Messages</Text>
            <View style={styles.digestBadge}>
              <Text style={styles.digestText}>Weekly Digest</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.signOut}
          onPress={() =>
            Alert.alert('Sign out', 'Leave the Vice Principal portal?', [
              { text: 'Cancel' },
              { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
            ])
          }
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenShell>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatLbl}>{label}</Text>
      <Text style={styles.heroStatVal}>{value}</Text>
    </View>
  );
}

function SettingsLink({ icon, label, onPress }: { icon: string; label: string; onPress?: () => void }) {
  const styles = useThemedStyles(createStyles);
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
      <View style={styles.settingLeft}>
        <MaterialIcons name={icon as 'person'} size={22} color={styles.outlineColor.color} />
        <Text style={styles.settingLbl}>{label}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={22} color={styles.outlineColor.color} />
    </TouchableOpacity>
  );
}

function SettingToggle({
  icon,
  label,
  value,
  onChange,
}: {
  icon?: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { colors } = useVicePrincipalTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        {icon ? <MaterialIcons name={icon as 'person'} size={22} color={colors.outline} /> : null}
        <Text style={styles.settingLbl}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.primary, false: colors.surfaceContainerHighest }}
        thumbColor={colors.onPrimary}
      />
    </View>
  );
}

function createStyles(colors: VicePrincipalColorScheme) {
  return StyleSheet.create({
    content: { padding: spacing.gutter, gap: spacing.lg, paddingBottom: 32 },
    hero: { borderRadius: 12, padding: spacing.lg, overflow: 'hidden' },
    heroRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
    initialsCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primaryContainer,
      borderWidth: 4,
      borderColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    initials: { fontSize: 32, fontWeight: '700', color: colors.onPrimary },
    heroName: { ...textStyle('headlineLgMobile'), color: colors.onPrimary, fontWeight: '700' },
    heroRole: { ...textStyle('bodyMd'), color: colors.onPrimary, opacity: 0.8 },
    heroSchool: { ...textStyle('labelMd'), color: colors.onPrimary, opacity: 0.7 },
    empBadge: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
    empText: { fontSize: 10, fontWeight: '700', color: colors.onPrimary, letterSpacing: 1 },
    heroStats: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: spacing.md },
    heroStat: { flex: 1, alignItems: 'center' },
    heroStatLbl: { ...textStyle('labelMd'), color: 'rgba(255,255,255,0.6)' },
    heroStatVal: { ...textStyle('titleLg'), color: colors.onPrimary },
    divider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },
    bentoGrid: { flexDirection: 'row', gap: spacing.md },
    bentoCard: {
      flex: 1,
      backgroundColor: colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: 12,
      padding: spacing.md,
    },
    bentoHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    bentoLbl: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, letterSpacing: 2 },
    bentoVal: { ...textStyle('bodyMd'), color: colors.onSurface },
    bentoSub: { ...textStyle('labelMd'), color: colors.outline },
    section: { ...textStyle('titleLg'), color: colors.onSurfaceVariant, paddingHorizontal: 4 },
    settingsCard: {
      backgroundColor: colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: 12,
      overflow: 'hidden',
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      minHeight: 56,
      borderBottomWidth: 1,
      borderBottomColor: `${colors.outlineVariant}80`,
    },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    settingLbl: { ...textStyle('bodyLg'), color: colors.onSurface },
    outlineColor: { color: colors.outline },
    digestRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      minHeight: 56,
    },
    digestBadge: { backgroundColor: `${colors.primaryContainer}1a`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
    digestText: { ...textStyle('labelMd'), color: colors.primary, fontWeight: '600' },
    signOut: { padding: 14, borderRadius: 12, backgroundColor: colors.dangerBg, alignItems: 'center' },
    signOutText: { ...textStyle('bodyMd'), color: colors.dangerText, fontWeight: '700' },
  });
}
