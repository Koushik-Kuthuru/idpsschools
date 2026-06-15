import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
  flat?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  flat,
  style,
  textStyle,
}: ButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.base,
        isPrimary && { backgroundColor: theme.colors.primary },
        !flat && isPrimary && styles.shadow,
        variant === 'outline' && { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.colors.primary },
        variant === 'ghost' && { backgroundColor: 'transparent' },
        flat && styles.noShadow,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : theme.colors.primary} />
      ) : (
        <>
          <Text
            style={[
              styles.text,
              { color: isPrimary ? '#fff' : theme.colors.primary },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && (
            <MaterialIcons
              name={icon}
              size={20}
              color={isPrimary ? '#fff' : theme.colors.primary}
              style={styles.icon}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  shadow: {
    shadowColor: '#0fbd83',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  noShadow: {
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  icon: { marginLeft: 8 },
  disabled: { opacity: 0.6 },
});
