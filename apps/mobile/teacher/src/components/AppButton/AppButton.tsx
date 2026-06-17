import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { AppIcon } from '../AppIcon';
import { colors } from '@/theme';
import { styles } from './AppButton.styles';
import type { AppButtonProps } from './AppButton.types';

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  fullWidth = true,
  flat,
}: AppButtonProps) {
  const variantStyle =
    variant === 'primary'
      ? styles.primary
      : variant === 'outline'
        ? styles.outline
        : variant === 'danger'
          ? styles.danger
          : styles.secondary;

  const labelStyle =
    variant === 'primary'
      ? styles.labelPrimary
      : variant === 'danger'
        ? styles.labelDanger
        : styles.labelOutline;

  const iconColor = variant === 'primary' ? colors.onPrimary : colors.primary;

  return (
    <TouchableOpacity
      style={[styles.base, variantStyle, fullWidth && styles.fullWidth, flat && styles.flat]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <>
          <Text style={labelStyle}>{label}</Text>
          {icon ? <AppIcon name={icon} size={20} color={iconColor} /> : null}
        </>
      )}
    </TouchableOpacity>
  );
}
