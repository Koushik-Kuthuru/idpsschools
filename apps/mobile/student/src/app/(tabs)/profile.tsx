import { useEffect, useState, type ReactNode } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useProfile, useUpdateAvatar } from '@/hooks/useApi';
import { useLogout } from '@/hooks/useLogout';
import { LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { QuickAccessGrid } from '@/components/navigation/QuickAccessGrid';
import { TAB_SCREEN_SCROLL_PADDING } from '@/constants/layout';
import { openPhoneDialer } from '@/utils/phone';
import { AnimatedChevron, Collapsible } from '@/components/ui/Collapsible';

export default function ProfileTab() {
  const theme = useTheme();
  const router = useRouter();
  const { confirmSignOut } = useLogout();
  const { data: profile, isLoading, error, refetch } = useProfile();
  const updateAvatar = useUpdateAvatar();
  const [transportOpen, setTransportOpen] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      updateAvatar.mutate(result.assets[0].uri);
    }
  };

  if (isLoading) return <LoadingScreen />;
  if (error || !profile) return <ErrorScreen message="Failed to load profile" onRetry={() => refetch()} />;

  const menuItemsBeforePassword = [
    { icon: 'badge' as const, label: 'Full Profile', route: '/profile' },
    { icon: 'assignment' as const, label: 'Assignments', route: '/assignments' },
    { icon: 'event' as const, label: 'Exam Schedule', route: '/exams/schedule' },
    { icon: 'schedule' as const, label: 'Class Timetable', route: '/exams/timetable' },
    { icon: 'settings' as const, label: 'Settings', route: '/settings' },
  ];

  const changePasswordItem = { icon: 'lock' as const, label: 'Change Password', route: '/settings/change-password' as const };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            <View style={[styles.avatarWrap, { borderColor: `${theme.colors.primary}33` }]}>
              {profile.avatar ? (
                <Image source={{ uri: profile.avatar }} style={styles.avatar} />
              ) : (
                <MaterialIcons name="person" size={48} color={theme.colors.primary} />
              )}
            </View>
            <View style={[styles.editBadge, { backgroundColor: theme.colors.primary }]}>
              <MaterialIcons name="edit" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.name, { color: theme.colors.text }]}>{profile.name}</Text>
          <View style={[styles.idBadge, { backgroundColor: `${theme.colors.primary}1a` }]}>
            <Text style={{ color: theme.colors.primary, fontSize: 10, fontWeight: '600', letterSpacing: 1 }}>
              ENROLLMENT ID: {profile.studentId}
            </Text>
          </View>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 14, marginTop: 8 }}>
            Class: {profile.className} | Roll: {profile.rollNumber}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          {[
            { label: 'GPA', value: '3.8/4.0' },
            { label: 'Rank', value: '5/45' },
            { label: 'Exams', value: '12' },
          ].map((s) => (
            <View key={s.label} style={[styles.statItem, { backgroundColor: `${theme.colors.primary}0d`, borderColor: `${theme.colors.primary}1a` }]}>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{s.label}</Text>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>{s.value}</Text>
            </View>
          ))}
        </View>

        <ProfileInfoCard
          theme={theme}
          title="Personal Info"
          icon="person"
          rows={[
            { label: 'Gender', value: profile.gender },
            { label: 'DOB', value: profile.dob },
            { label: 'Blood Group', value: profile.bloodGroup },
          ]}
        />

        {profile.transport ? (
          <ProfileInfoCard
            theme={theme}
            title="Transport"
            icon="directions-bus"
            collapsible
            open={transportOpen}
            onToggle={() => setTransportOpen((open) => !open)}
            rows={[
              { label: 'Transport Incharge', value: profile.transport.inchargeNumber, phone: profile.transport.inchargeNumber },
              { label: 'Driver Name', value: profile.transport.driverName },
              { label: 'Driver Phone', value: profile.transport.driverNumber, phone: profile.transport.driverNumber },
              { label: 'Route No.', value: profile.transport.routeNo },
              { label: 'Destination', value: profile.transport.destinationAddress },
              { label: 'Captain', value: profile.transport.captainName },
            ]}
            footer={
              <TouchableOpacity
                style={[styles.trackingLink, { borderTopColor: theme.colors.border }]}
                onPress={() => Linking.openURL(profile.transport!.trackingLink)}
              >
                <View style={styles.trackingLinkHeader}>
                  <MaterialIcons name="my-location" size={18} color={theme.colors.primary} />
                  <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Tracking Link</Text>
                </View>
                <Text style={[styles.infoValue, styles.infoValueLink, { color: theme.colors.primary }]} numberOfLines={2}>
                  {profile.transport.trackingLink}
                </Text>
              </TouchableOpacity>
            }
          />
        ) : null}

        <View style={styles.menu}>
          {menuItemsBeforePassword.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              onPress={() => router.push(item.route as '/settings')}
            >
              <MaterialIcons name={item.icon} size={22} color={theme.colors.primary} />
              <Text style={[styles.menuLabel, { color: theme.colors.text }]}>{item.label}</Text>
              <MaterialIcons name="chevron-right" size={22} color={theme.colors.textMuted} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => router.push(changePasswordItem.route)}
          >
            <MaterialIcons name={changePasswordItem.icon} size={22} color={theme.colors.primary} />
            <Text style={[styles.menuLabel, { color: theme.colors.text }]}>{changePasswordItem.label}</Text>
            <MaterialIcons name="chevron-right" size={22} color={theme.colors.textMuted} />
          </TouchableOpacity>

          <Text style={[styles.quickAccessTitle, { color: theme.colors.text }]}>Quick Access</Text>
          <QuickAccessGrid />

          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={() => confirmSignOut()}>
            <MaterialIcons name="logout" size={22} color={theme.colors.red500} />
            <Text style={[styles.menuLabel, { color: theme.colors.red500 }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type ProfileInfoRow = { label: string; value?: string; phone?: string };

function ProfileInfoCard({
  theme,
  title,
  icon,
  rows,
  collapsible = false,
  open = true,
  onToggle,
  footer,
}: {
  theme: ReturnType<typeof useTheme>;
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  rows: ProfileInfoRow[];
  collapsible?: boolean;
  open?: boolean;
  onToggle?: () => void;
  footer?: ReactNode;
}) {
  const headerSpacing = useSharedValue(collapsible && !open ? 0 : 16);

  useEffect(() => {
    if (!collapsible) return;
    headerSpacing.value = withTiming(open ? 16 : 0, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
  }, [collapsible, headerSpacing, open]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    marginBottom: headerSpacing.value,
  }));

  const cardStyle = [styles.infoCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }];
  const body = (
    <>
      {rows.map((row) => (
        <View key={row.label} style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>{row.label}</Text>
          {row.phone && row.value ? (
            <TouchableOpacity onPress={() => openPhoneDialer(row.phone!)} style={styles.infoValueWrap}>
              <Text style={[styles.infoValue, styles.infoValueLink, { color: theme.colors.primary }]}>{row.value}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>{row.value}</Text>
          )}
        </View>
      ))}
      {footer}
    </>
  );

  const headerContent = (
    <>
      <MaterialIcons name={icon} size={20} color={theme.colors.primary} />
      <Text style={[styles.infoTitle, { color: theme.colors.text }]}>{title}</Text>
      {collapsible ? <AnimatedChevron expanded={open} color={theme.colors.textMuted} /> : null}
    </>
  );

  return (
    <View style={cardStyle}>
      {collapsible ? (
        <TouchableOpacity onPress={onToggle} activeOpacity={0.7}>
          <Animated.View style={[styles.infoHeader, headerAnimatedStyle]}>{headerContent}</Animated.View>
        </TouchableOpacity>
      ) : (
        <View style={styles.infoHeader}>{headerContent}</View>
      )}
      {collapsible ? <Collapsible expanded={open}>{body}</Collapsible> : body}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: TAB_SCREEN_SCROLL_PADDING },
  profileSection: { alignItems: 'center', marginBottom: 24 },
  avatarContainer: { position: 'relative' },
  avatarWrap: { width: 128, height: 128, borderRadius: 64, borderWidth: 4, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  avatar: { width: '100%', height: '100%' },
  editBadge: { position: 'absolute', bottom: 4, right: 4, padding: 6, borderRadius: 999, borderWidth: 2, borderColor: '#fff' },
  name: { fontSize: 24, fontWeight: '700', marginTop: 16 },
  idBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, marginTop: 8 },
  statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statItem: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  statValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  infoCard: { padding: 20, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  infoTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  infoLabel: { fontSize: 14 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 6, gap: 12 },
  infoValue: { fontWeight: '600', fontSize: 14, flex: 1, textAlign: 'right' },
  infoValueWrap: { flex: 1, alignItems: 'flex-end' },
  infoValueLink: { textDecorationLine: 'underline' },
  trackingLink: { marginTop: 8, paddingTop: 12, borderTopWidth: 1 },
  trackingLinkHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  menu: { gap: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, gap: 12 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  logoutItem: { borderColor: 'transparent', backgroundColor: 'transparent', marginTop: 8 },
  quickAccessTitle: { fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 12 },
});
