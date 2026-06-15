import React, { type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { stitchImages } from '@/assets/images';
import { SCHOOL_NAME } from '@/constants/school';
import { colors, spacing, textStyle } from '@/designations/academic-manager/theme';

const TITLE_INSET = 112;
const IDENTITY_BAR_HEIGHT = 68;
const NOTIFY_GAP = 16;

interface ManagerHeaderProps {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  subtitle?: string;
  identity?: {
    orgTitle?: string;
    orgSubtitle?: string;
    notificationCount?: number;
    onNotifications?: () => void;
  };
}

export function ManagerHeader({ title, onBack, right, subtitle, identity }: ManagerHeaderProps) {
  if (identity) {
    const count = identity.notificationCount ?? 0;
    const badgeLabel = count > 9 ? '9+' : String(count);

    return (
      <View
        style={[
          styles.identityBar,
          { backgroundColor: colors.surfaceContainerLowest, borderBottomColor: colors.outlineVariant },
        ]}
      >
        <View style={styles.identityLeft}>
          <Image source={{ uri: stitchImages.loginLogo }} style={styles.logoImage} contentFit="contain" />
          <View style={styles.identityText}>
            <Text
              style={[textStyle('titleLg'), styles.identityTitle, { color: colors.primary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {identity.orgTitle ?? 'Academic Manager'}
            </Text>
            <Text
              style={[styles.identitySub, { color: colors.onSurfaceVariant }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {identity.orgSubtitle ?? SCHOOL_NAME}
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
              <View style={[styles.badge, { backgroundColor: colors.error }]}>
                <Text style={[styles.badgeText, { color: colors.onError }]}>{badgeLabel}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.bar, { backgroundColor: colors.surfaceContainerLowest, borderBottomColor: colors.outlineVariant }]}>
      <View style={styles.actionsRow}>
        <View style={styles.sideLeft}>
          {onBack ? (
            <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
              <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconBtn} />
          )}
        </View>
        <View style={styles.sideRight}>{right ?? <View style={styles.iconBtn} />}</View>
      </View>

      <View style={[styles.titleCenter, { left: TITLE_INSET, right: TITLE_INSET }]} pointerEvents="none">
        <Text style={[textStyle('titleLg'), styles.title, { color: colors.onSurface }]} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]} numberOfLines={1} ellipsizeMode="tail">
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: spacing.headerHeight,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    maxWidth: spacing.maxWidth,
    width: '100%',
    alignSelf: 'center',
    position: 'relative',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: spacing.headerHeight,
    width: '100%',
  },
  identityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: IDENTITY_BAR_HEIGHT,
    paddingLeft: spacing.gutter,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    maxWidth: spacing.maxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  sideLeft: {
    minWidth: 40,
    maxWidth: 132,
    flexShrink: 0,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sideRight: {
    minWidth: 40,
    maxWidth: 132,
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  titleCenter: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  title: { textAlign: 'center', fontWeight: '600', width: '100%' },
  subtitle: { ...textStyle('chip10'), textAlign: 'center', marginTop: 2, width: '100%' },
  identityLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: NOTIFY_GAP,
  },
  identityRight: {
    flexShrink: 0,
    marginLeft: NOTIFY_GAP,
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs,
  },
  identityText: { flex: 1, minWidth: 0, gap: 2 },
  logoImage: { width: 36, height: 36, borderRadius: 8, flexShrink: 0 },
  identityTitle: { fontWeight: '600' },
  identitySub: { ...textStyle('chip10'), letterSpacing: 0.4 },
  notifyBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: '700', lineHeight: 12 },
});
