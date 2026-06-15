import React, { type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { stitchImages } from '@/assets/images';
import { SCHOOL_NAME } from '@/constants/school';
import { spacing, textStyle, useThemedStyles, useVicePrincipalTheme } from '../theme';
import type { VicePrincipalColorScheme } from '../theme/colors';

type HeaderVariant = 'dashboard' | 'back' | 'brand';
type IconName = ComponentProps<typeof MaterialIcons>['name'];
export type HeaderActionIcon = 'add' | 'history' | 'download' | 'edit' | 'event' | 'filter' | 'file-download';

const ACTION_ICONS: Record<HeaderActionIcon, IconName> = {
  add: 'add',
  history: 'history',
  download: 'download',
  edit: 'edit',
  event: 'event',
  filter: 'filter-list',
  'file-download': 'file-download',
};

interface VicePrincipalHeaderProps {
  variant?: HeaderVariant;
  title?: string;
  onBack?: () => void;
  onMenu?: () => void;
  onFilter?: () => void;
  onAction?: () => void;
  actionIcon?: HeaderActionIcon;
  actionFilled?: boolean;
  right?: ReactNode;
  notificationCount?: number;
  onNotifications?: () => void;
  avatarUri?: string;
  identity?: {
    orgTitle?: string;
    orgSubtitle?: string;
    notificationCount?: number;
    onNotifications?: () => void;
  };
}

export function VicePrincipalHeader({
  variant = 'back',
  title = '',
  onBack,
  onMenu,
  onFilter,
  onAction,
  actionIcon,
  actionFilled,
  right,
  notificationCount,
  onNotifications,
  avatarUri,
  identity,
}: VicePrincipalHeaderProps) {
  const { colors } = useVicePrincipalTheme();
  const styles = useThemedStyles(createStyles);

  if (identity) {
    const count = identity.notificationCount ?? 0;
    const badgeLabel = count > 9 ? '9+' : String(count);

    return (
      <View style={[styles.bar, styles.identityBar]}>
        <View style={styles.identityLeft}>
          <Image source={{ uri: stitchImages.loginLogo }} style={styles.logoImage} contentFit="contain" />
          <View style={styles.identityText}>
            <Text style={styles.identityTitle}>{identity.orgTitle ?? SCHOOL_NAME}</Text>
            <Text style={styles.identitySub} numberOfLines={1}>
              {identity.orgSubtitle ?? 'Vice Principal'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.notifyBtn}
          onPress={identity.onNotifications}
          activeOpacity={0.7}
          accessibilityLabel="Notifications"
        >
          <MaterialIcons name="notifications" size={22} color={colors.primary} />
          {count > 0 ? (
            <View style={styles.identityBadge}>
              <Text style={styles.identityBadgeText}>{badgeLabel}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>
    );
  }

  if (variant === 'dashboard') {
    const badge = notificationCount && notificationCount > 0 ? (notificationCount > 9 ? '9+' : String(notificationCount)) : null;
    return (
      <View style={styles.dashboardBar}>
        <TouchableOpacity onPress={onMenu} hitSlop={8} activeOpacity={0.7}>
          <MaterialIcons name="menu" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.brandRow}>
          <MaterialIcons name="school" size={22} color={colors.primary} />
          <Text style={styles.brandText}>IDPS Global</Text>
        </View>
        <View style={styles.dashboardRight}>
          <TouchableOpacity onPress={onNotifications} hitSlop={8} activeOpacity={0.7}>
            <MaterialIcons name="notifications" size={22} color={colors.onSurfaceVariant} />
            {badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialIcons name="person" size={18} color={colors.onPrimary} />
            </View>
          )}
        </View>
      </View>
    );
  }

  if (variant === 'brand') {
    return (
      <View style={styles.brandBar}>
        <View style={styles.brandRow}>
          <MaterialIcons name="school" size={22} color={colors.primary} />
          <Text style={styles.brandTitle}>{title}</Text>
        </View>
        {actionIcon && onAction ? (
          <TouchableOpacity onPress={onAction} hitSlop={8} activeOpacity={0.7} style={styles.actionBtn}>
            <MaterialIcons name={ACTION_ICONS[actionIcon]} size={22} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        ) : null}
        {right}
      </View>
    );
  }

  const resolvedAction = actionIcon ?? (onFilter ? 'filter' : undefined);
  const resolvedOnAction = onAction ?? onFilter;

  return (
    <View style={styles.bar}>
      <View style={styles.sideLeft}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} hitSlop={8} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <View style={styles.sideRight}>
        {resolvedAction && resolvedOnAction ? (
          <TouchableOpacity
            onPress={resolvedOnAction}
            hitSlop={8}
            activeOpacity={0.7}
            style={actionFilled ? styles.actionFilled : undefined}
          >
            <MaterialIcons
              name={ACTION_ICONS[resolvedAction]}
              size={22}
              color={actionFilled ? colors.onPrimaryContainer : colors.primary}
            />
          </TouchableOpacity>
        ) : null}
        {right}
        {!resolvedAction && !right ? <View style={styles.spacer} /> : null}
      </View>
    </View>
  );
}

function createStyles(colors: VicePrincipalColorScheme) {
  return StyleSheet.create({
    dashboardBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: spacing.headerHeight,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    brandBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 64,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    brandText: { ...textStyle('titleLg'), color: colors.primary, fontWeight: '700' },
    brandTitle: { ...textStyle('headlineLgMobile'), color: colors.primary, fontWeight: '700' },
    dashboardRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    badge: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.tertiary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    badgeText: { ...textStyle('chip10'), color: colors.onTertiary, fontSize: 9 },
    avatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.outlineVariant },
    avatarPlaceholder: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: spacing.headerHeight,
      paddingHorizontal: spacing.gutter,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    sideLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
    sideRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    title: { ...textStyle('headlineMd'), color: colors.primary, fontWeight: '600', flexShrink: 1 },
    spacer: { width: 22 },
    actionBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionFilled: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    identityBar: {
      backgroundColor: colors.surfaceContainerLowest,
      paddingHorizontal: spacing.gutter,
    },
    identityLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    identityText: { flex: 1 },
    logoImage: { width: 40, height: 40, borderRadius: 8 },
    identityTitle: { ...textStyle('headlineMd'), color: colors.primary, lineHeight: 22 },
    identitySub: { ...textStyle('chip10'), color: colors.onSurfaceVariant, letterSpacing: 1 },
    notifyBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    identityBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.error,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    identityBadgeText: { fontSize: 9, fontWeight: '700', color: colors.onError },
  });
}
