import React, { type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { stitchImages } from '@/assets/images';
import { SCHOOL_NAME } from '@/constants/school';
import { spacing, textStyle, usePrincipalTheme, useThemedStyles } from '@/designations/principal/theme';
import type { PrincipalColorScheme } from '@/designations/principal/theme/colors';

const NOTIFY_GAP = 16;

type HeaderVariant = 'back' | 'avatar' | 'primary';

interface PrincipalHeaderProps {
  variant?: HeaderVariant;
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  avatarUri?: string;
  identity?: {
    orgTitle?: string;
    orgSubtitle?: string;
    notificationCount?: number;
    onNotifications?: () => void;
  };
}

export function PrincipalHeader({
  variant = 'back',
  title,
  onBack,
  right,
  avatarUri,
  identity,
}: PrincipalHeaderProps) {
  const { colors } = usePrincipalTheme();
  const styles = useThemedStyles(createStyles);

  if (identity) {
    const count = identity.notificationCount ?? 0;
    const badgeLabel = count > 9 ? '9+' : String(count);

    return (
      <View style={[styles.bar, styles.identityBar]}>
        <View style={styles.identityLeft}>
          <Image source={{ uri: stitchImages.loginLogo }} style={styles.logoImage} contentFit="contain" />
          <View style={styles.identityText}>
            <Text style={styles.identityTitle}>
              {identity.orgTitle ?? SCHOOL_NAME}
            </Text>
            <Text style={styles.identitySub} numberOfLines={1}>
              {identity.orgSubtitle ?? 'Principal'}
            </Text>
          </View>
        </View>
        <View style={styles.identityRight}>
          <TouchableOpacity
            style={styles.notifyBtn}
            onPress={identity.onNotifications}
            activeOpacity={0.7}
            accessibilityLabel="Notifications"
          >
            <MaterialIcons name="notifications" size={22} color={colors.primary} />
            {count > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badgeLabel}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (variant === 'avatar') {
    return (
      <View style={styles.bar}>
        <View style={styles.avatarLeft}>
          <Image source={{ uri: avatarUri ?? stitchImages.teacherAvatar }} style={styles.avatarImg} contentFit="cover" />
          <Text style={styles.avatarTitle}>{title}</Text>
        </View>
        {right ? <View style={styles.sideRight}>{right}</View> : null}
      </View>
    );
  }

  const isPrimary = variant === 'primary';

  return (
    <View style={[styles.bar, isPrimary && styles.primaryBar]}>
      <View style={styles.sideLeft}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} hitSlop={8}>
            <MaterialIcons name="arrow-back" size={22} color={isPrimary ? colors.onPrimary : colors.onSurfaceVariant} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconSpacer} />
        )}
        <Text style={[styles.title, isPrimary && styles.titleOnPrimary]} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {right ? <View style={styles.sideRight}>{right}</View> : <View style={styles.iconSpacer} />}
    </View>
  );
}

function createStyles(colors: PrincipalColorScheme) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: spacing.headerHeight,
      paddingHorizontal: spacing.gutter,
      backgroundColor: colors.surfaceContainerLowest,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    identityBar: { minHeight: 80, paddingVertical: spacing.sm },
    primaryBar: { backgroundColor: colors.primary, borderBottomWidth: 0 },
    identityLeft: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingRight: NOTIFY_GAP,
    },
    identityText: { flex: 1, minWidth: 0, gap: 2 },
    identityTitle: {
      ...textStyle('titleLg'),
      fontSize: 17,
      lineHeight: 21,
      fontWeight: '700',
      color: colors.primary,
      flexShrink: 1,
    },
    identitySub: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, letterSpacing: 0.2 },
    logoImage: { width: 40, height: 40, borderRadius: 8, flexShrink: 0 },
    identityRight: { flexShrink: 0, marginLeft: NOTIFY_GAP, paddingRight: spacing.xs },
    notifyBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    badge: {
      position: 'absolute',
      top: 4,
      right: 2,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.error,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    badgeText: { ...textStyle('chip10'), color: colors.onError, fontSize: 9, lineHeight: 11 },
    sideLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
    sideRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    title: { ...textStyle('headlineMd'), fontWeight: '600', color: colors.onSurface, flexShrink: 1 },
    titleOnPrimary: { color: colors.onPrimary, fontWeight: '700' },
    iconSpacer: { width: 22 },
    avatarLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
    avatarImg: { width: 36, height: 36, borderRadius: 18 },
    avatarTitle: { ...textStyle('titleLg'), fontWeight: '700', color: colors.onSurface },
  });
}
