import React, { type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { stitchImages } from '@/assets/images';
import { SCHOOL_NAME } from '@/constants/school';
import { spacing, textStyle, useAcademicTheme } from '@/designations/academic-director/theme';

interface AcademicHeaderProps {
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

export function AcademicHeader({ title, onBack, right, subtitle, identity }: AcademicHeaderProps) {
  const { colors } = useAcademicTheme();

  if (identity) {
    return (
      <View style={[styles.bar, { backgroundColor: colors.surfaceContainerLowest, borderBottomColor: colors.outlineVariant }]}>
        <View style={styles.identityLeft}>
          <Image source={{ uri: stitchImages.loginLogo }} style={styles.logoImage} contentFit="contain" />
          <View>
            <Text style={[textStyle('headlineMd'), styles.identityTitle, { color: colors.primary }]}>{identity.orgTitle ?? 'Academic Office'}</Text>
            <Text style={[styles.identitySub, { color: colors.onSurfaceVariant }]}>{identity.orgSubtitle ?? SCHOOL_NAME}</Text>
          </View>
        </View>
        <View style={styles.identityRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={identity.onNotifications}>
            <MaterialIcons name="notifications" size={22} color={colors.primary} />
            {identity.notificationCount ? (
              <View style={[styles.badge, { backgroundColor: colors.error }]}>
                <Text style={[styles.badgeText, { color: colors.onError }]}>{identity.notificationCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.bar, { backgroundColor: colors.surfaceContainerLowest, borderBottomColor: colors.outlineVariant }]}>
      {onBack ? (
        <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconBtn} />
      )}
      <View style={styles.titleWrap}>
        <Text style={[textStyle('headlineMd'), styles.title, { color: colors.onSurface }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>{subtitle}</Text> : null}
      </View>
      <View style={styles.right}>{right ?? <View style={styles.iconBtn} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: spacing.headerHeight,
    paddingHorizontal: spacing.gutter,
    borderBottomWidth: 1,
    maxWidth: spacing.maxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1, alignItems: 'center' },
  title: { textAlign: 'center' },
  subtitle: { ...textStyle('chip10'), textAlign: 'center', marginTop: 2 },
  right: { minWidth: 40, alignItems: 'flex-end' },
  identityLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  identityRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoImage: { width: 40, height: 40, borderRadius: 8 },
  identityTitle: { lineHeight: 22 },
  identitySub: { ...textStyle('chip10'), letterSpacing: 1 },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 9, fontWeight: '700' },
});
