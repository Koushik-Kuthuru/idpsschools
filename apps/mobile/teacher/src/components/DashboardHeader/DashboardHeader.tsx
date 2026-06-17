import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppIcon } from '../AppIcon';
import { colors, spacing } from '@/theme';

export interface ScreenTopBarAction {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export interface DashboardTopBarProps {
  name: string;
  title?: string;
  avatarUrl?: string;
  notificationCount?: number;
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
  showBack?: boolean;
  onBackPress?: () => void;
  showNotifications?: boolean;
  showProfile?: boolean;
  headerAction?: ScreenTopBarAction;
}

interface DashboardWelcomeSectionProps {
  name: string;
  subtitle?: string;
}

interface DashboardHeaderProps extends DashboardTopBarProps, DashboardWelcomeSectionProps {}

function formatTodayLabel() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function getFirstName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1 && parts[0].endsWith('.')) return parts[1];
  return parts[0] ?? fullName;
}

function getInitials(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.replace('.', '')[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function DashboardTopBar({
  name,
  title = 'Dashboard',
  avatarUrl,
  notificationCount = 0,
  onProfilePress,
  onNotificationPress,
  showBack = false,
  onBackPress,
  showNotifications = true,
  showProfile = true,
  headerAction,
}: DashboardTopBarProps) {
  const navigation = useNavigation();
  const initials = getInitials(name);
  const [avatarFailed, setAvatarFailed] = React.useState(false);
  const showAvatarImage = Boolean(avatarUrl) && !avatarFailed;

  const handleBack = () => {
    if (onBackPress) onBackPress();
    else if (navigation.canGoBack()) navigation.goBack();
  };

  return (
    <View style={styles.topBar}>
      <View style={styles.topBarLeft}>
        {showBack ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <AppIcon name="arrow_back" size={22} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
        <View style={styles.titleRow}>
          <View style={styles.titleAccent} />
          <Text style={styles.pageTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>

      <View style={styles.topBarRight}>
        {headerAction ? (
          <TouchableOpacity
            onPress={headerAction.onPress}
            disabled={headerAction.disabled}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.headerActionText, headerAction.disabled && styles.headerActionDisabled]}>
              {headerAction.label}
            </Text>
          </TouchableOpacity>
        ) : null}

        {showNotifications ? (
          <>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={onNotificationPress}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={
                notificationCount > 0 ? `Open notifications, ${notificationCount} unread` : 'Open notifications'
              }
            >
              <AppIcon name="notifications" size={22} color={colors.slate500} />
              {notificationCount > 0 ? <View style={styles.notifDot} /> : null}
            </TouchableOpacity>
            {showProfile ? <View style={styles.divider} /> : null}
          </>
        ) : null}

        {showProfile ? (
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={onProfilePress}
            activeOpacity={0.85}
            disabled={!onProfilePress}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
          >
            {showAvatarImage ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarSmall}
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <View style={styles.avatarInitials}>
                <Text style={styles.avatarInitialsText}>{initials}</Text>
              </View>
            )}
            <View style={styles.onlineDot} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export function DashboardWelcomeSection({ name, subtitle }: DashboardWelcomeSectionProps) {
  const firstName = getFirstName(name);

  return (
    <View style={styles.scrollableSection}>
      <View style={styles.welcomeBand}>
        <View style={styles.welcomeTextBlock}>
          <Text style={styles.greeting}>Hi, {firstName}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitleLine} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.dateChip}>
          <AppIcon name="calendar_today" size={14} color={colors.primary} />
          <Text style={styles.dateText}>{formatTodayLabel()}</Text>
        </View>
      </View>
    </View>
  );
}

export function DashboardHeader(props: DashboardHeaderProps) {
  return (
    <View style={styles.wrap}>
      <DashboardTopBar {...props} />
      <DashboardWelcomeSection {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.canvas,
    paddingBottom: spacing.sm,
  },
  scrollableSection: {
    backgroundColor: colors.canvas,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.slate200,
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  topBarLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  titleAccent: {
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.slate900,
    letterSpacing: -0.4,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  headerActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  headerActionDisabled: {
    opacity: 0.5,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.surfaceContainerLowest,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: colors.slate200,
  },
  profileBtn: {
    position: 'relative',
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.surfaceContainerLowest,
    backgroundColor: colors.slate100,
  },
  avatarInitials: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surfaceContainerLowest,
  },
  avatarInitialsText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.surfaceContainerLowest,
  },
  welcomeBand: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingTop: 14,
    paddingBottom: 12,
  },
  welcomeTextBlock: { flex: 1, minWidth: 0 },
  greeting: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate500,
    marginBottom: 2,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.slate900,
    letterSpacing: -0.4,
  },
  subtitleLine: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 4,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'capitalize',
  },
});
