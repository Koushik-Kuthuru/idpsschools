import { useState, type ReactNode } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useProfile, useUpdateAvatar } from '@/hooks/useApi';
import { ErrorScreen } from '@/components/ui/ScreenHeader';
import { ProfileSkeleton } from '@/components/ui/Skeleton';
import { openPhoneDialer } from '@/utils/phone';
import { AnimatedChevron, Collapsible } from '@/components/ui/Collapsible';

interface StudentProfileViewProps {
  showClose?: boolean;
  onClose?: () => void;
}

export function StudentProfileView({ showClose, onClose }: StudentProfileViewProps) {
  const theme = useTheme();
  const { data: profile, isLoading, error, refetch } = useProfile();
  const updateAvatar = useUpdateAvatar();

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

  if (isLoading) return <ProfileSkeleton />;
  if (error || !profile) return <ErrorScreen message="Failed to load profile" onRetry={() => refetch()} />;

  const infoRows = [
    { icon: 'person' as const, label: 'Gender', value: profile.gender },
    { icon: 'calendar-today' as const, label: 'Date of Birth', value: profile.dob },
    { icon: 'cake' as const, label: 'Age', value: '16 years' },
    { icon: 'bloodtype' as const, label: 'Blood Group', value: profile.bloodGroup },
  ];

  const contactRows = [
    { icon: 'email' as const, label: 'Email', value: profile.email },
    { icon: 'phone' as const, label: 'Phone', value: profile.phone, phone: profile.phone },
    { icon: 'location-on' as const, label: 'Address', value: profile.address },
  ];

  return (
    <ScrollView contentContainerStyle={styles.scroll} style={{ backgroundColor: theme.colors.background }}>
      <View style={styles.hero}>
        <TouchableOpacity onPress={pickImage} style={styles.avatarWrap}>
          <View style={[styles.avatarBorder, { borderColor: `${theme.colors.primary}33` }]}>
            {profile.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            ) : (
              <MaterialIcons name="person" size={64} color={theme.colors.primary} />
            )}
          </View>
          <View style={[styles.editBadge, { backgroundColor: theme.colors.primary }]}>
            <MaterialIcons name="edit" size={14} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={[styles.name, { color: theme.colors.text }]}>{profile.name}</Text>
        <View style={styles.badges}>
          {[`Enrollment: ${profile.studentId}`, `Class: ${profile.className}`, `Roll: ${profile.rollNumber}`].map((b) => (
            <View key={b} style={[styles.badge, { backgroundColor: `${theme.colors.primary}1a` }]}>
              <Text style={{ color: theme.colors.primary, fontSize: 10, fontWeight: '700' }}>{b.toUpperCase()}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={[styles.changePhoto, { backgroundColor: theme.colors.primary }]} onPress={pickImage}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Change Photo</Text>
        </TouchableOpacity>
      </View>

      <InfoSection title="Personal Info" rows={infoRows} theme={theme} />
      <InfoSection title="Contact Info" rows={contactRows} theme={theme} />
      <InfoSection
        title="Parent Information"
        rows={[
          { icon: 'man' as const, label: 'Father', value: profile.parentName ?? 'John Johnson', sub: profile.parentPhone, phone: profile.parentPhone, dialSub: true },
          { icon: 'woman' as const, label: 'Mother', value: 'Mary Johnson', sub: '+1-555-0003', phone: '+1-555-0003', dialSub: true },
        ]}
        theme={theme}
      />
      {profile.transport ? (
        <InfoSection
          title="Transport"
          collapsible
          rows={[
            { icon: 'support-agent' as const, label: 'Transport Incharge', value: profile.transport.inchargeNumber, phone: profile.transport.inchargeNumber },
            { icon: 'person' as const, label: 'Driver Name', value: profile.transport.driverName },
            { icon: 'phone' as const, label: 'Driver Phone', value: profile.transport.driverNumber, phone: profile.transport.driverNumber },
            { icon: 'route' as const, label: 'Route No.', value: profile.transport.routeNo },
            { icon: 'location-on' as const, label: 'Destination', value: profile.transport.destinationAddress },
            { icon: 'person' as const, label: 'Captain', value: profile.transport.captainName },
          ]}
          footer={
            <TouchableOpacity
              style={[styles.trackingCardInner, { borderTopColor: `${theme.colors.primary}0d` }]}
              onPress={() => Linking.openURL(profile.transport!.trackingLink)}
            >
              <View style={styles.trackingHeader}>
                <MaterialIcons name="my-location" size={22} color={theme.colors.primary} />
                <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '700' }}>TRACKING LINK</Text>
              </View>
              <Text style={{ color: theme.colors.primary, fontSize: 14, fontWeight: '600' }} numberOfLines={2}>
                {profile.transport.trackingLink}
              </Text>
            </TouchableOpacity>
          }
          theme={theme}
        />
      ) : null}
    </ScrollView>
  );
}

function InfoSection({
  title,
  rows,
  theme,
  collapsible = false,
  footer,
}: {
  title: string;
  rows: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value?: string; sub?: string; phone?: string; dialSub?: boolean }[];
  theme: ReturnType<typeof useTheme>;
  collapsible?: boolean;
  footer?: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  const rowContent = rows.map((row) => (
    <View key={row.label} style={[styles.row, { borderBottomColor: `${theme.colors.primary}0d` }]}>
      <View style={[styles.rowIcon, { backgroundColor: `${theme.colors.primary}1a` }]}>
        <MaterialIcons name={row.icon} size={22} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '700' }}>{row.label.toUpperCase()}</Text>
        {row.phone && row.value && !row.dialSub ? (
          <TouchableOpacity onPress={() => openPhoneDialer(row.phone!)}>
            <Text style={{ color: theme.colors.primary, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' }}>{row.value}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '500' }}>{row.value}</Text>
        )}
        {row.sub ? (
          row.phone && row.dialSub ? (
            <TouchableOpacity onPress={() => openPhoneDialer(row.phone!)}>
              <Text style={{ color: theme.colors.primary, fontSize: 12, textDecorationLine: 'underline' }}>{row.sub}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{row.sub}</Text>
          )
        ) : null}
      </View>
    </View>
  ));

  const body = (
    <>
      {rowContent}
      {footer}
    </>
  );

  return (
    <View style={[styles.section, { backgroundColor: theme.colors.card, borderColor: `${theme.colors.primary}0d` }]}>
      {collapsible ? (
        <TouchableOpacity
          style={styles.sectionTitleContainer}
          onPress={() => setExpanded((open) => !open)}
          activeOpacity={0.7}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.primary, flex: 1 }]}>{title.toUpperCase()}</Text>
          <AnimatedChevron expanded={expanded} color={theme.colors.textMuted} />
        </TouchableOpacity>
      ) : (
        <View style={styles.sectionTitleContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>{title.toUpperCase()}</Text>
        </View>
      )}
      {collapsible ? <Collapsible expanded={expanded}>{body}</Collapsible> : body}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  hero: { alignItems: 'center', padding: 24 },
  avatarWrap: { position: 'relative', marginBottom: 16 },
  avatarBorder: { width: 128, height: 128, borderRadius: 64, borderWidth: 4, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  avatar: { width: '100%', height: '100%' },
  editBadge: { position: 'absolute', bottom: 4, right: 4, padding: 6, borderRadius: 999, borderWidth: 2, borderColor: '#fff' },
  name: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 16 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  changePhoto: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  section: { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  sectionTitleContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8 },
  sectionTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  trackingCardInner: { padding: 16, borderTopWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1 },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  trackingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
});
