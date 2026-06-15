import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppIcon } from '../AppIcon';
import { colors, textStyle } from '@/theme';
import { styles } from './AppHeader.styles';
import type { AppHeaderProps } from './AppHeader.types';

export function AppHeader({
  variant = 'back',
  title,
  subtitle,
  chipLabel,
  showNotification,
  notificationCount = 0,
  showBack = true,
  rightAction,
  rightIcon,
  onBackPress,
  onNotificationPress,
  avatarUrl,
  greeting,
  name,
}: AppHeaderProps) {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBackPress) onBackPress();
    else if (navigation.canGoBack()) navigation.goBack();
  };

  if (variant === 'identity') {
    return (
      <View style={[styles.container, styles.containerIdentity]}>
        <View style={styles.left}>
          <View style={styles.avatarWrap}>
            {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatar} /> : null}
          </View>
          <View style={styles.identityCol}>
            {greeting ? (
              <Text style={[textStyle('subtitle13'), styles.greetingLabel]} numberOfLines={1}>
                {greeting}
              </Text>
            ) : null}
            {name ? (
              <Text style={[textStyle('headlineSmMobile'), styles.title]} numberOfLines={2}>
                {name}
              </Text>
            ) : greeting ? (
              <Text style={[textStyle('headlineSmMobile'), styles.title]} numberOfLines={2}>
                {greeting}
              </Text>
            ) : null}
            {subtitle ? (
              <Text style={[textStyle('labelSm'), styles.subtitle]} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        {showNotification ? (
          <TouchableOpacity style={styles.notifyBtn} onPress={onNotificationPress} activeOpacity={0.7}>
            <AppIcon name="notifications" color={colors.onSurfaceVariant} />
            {notificationCount > 0 ? <View style={styles.notifyDot} /> : null}
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.containerCompact]}>
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <AppIcon name="arrow_back" color={colors.primary} />
          </TouchableOpacity>
        ) : null}
        <View style={styles.titleBlock}>
          {title ? <Text style={[textStyle('headlineSm'), styles.title]}>{title}</Text> : null}
          {chipLabel ? (
            <View style={styles.chip}>
              <Text style={[textStyle('chip10'), styles.chipText]}>{chipLabel}</Text>
            </View>
          ) : null}
        </View>
      </View>
      {rightAction ? (
        <TouchableOpacity onPress={rightAction.onPress} activeOpacity={0.7}>
          <Text style={[textStyle('labelLg'), styles.rightAction]}>{rightAction.label}</Text>
        </TouchableOpacity>
      ) : null}
      {rightIcon ? (
        <TouchableOpacity activeOpacity={0.7}>
          <AppIcon name={rightIcon} color={colors.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
