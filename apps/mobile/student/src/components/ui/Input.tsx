import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  error?: string;
  isPassword?: boolean;
  onTogglePassword?: () => void;
  showPassword?: boolean;
}

export function Input({
  label,
  icon,
  error,
  isPassword,
  onTogglePassword,
  showPassword,
  style,
  editable = true,
  keyboardType,
  ...props
}: InputProps) {
  const theme = useTheme();
  const resolvedKeyboard =
    keyboardType === 'phone-pad' && Platform.OS === 'web' ? 'default' : keyboardType;

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
      )}
      <View style={styles.inputRow}>
        {icon && (
          <View style={styles.leftIconWrap} pointerEvents="none">
            <MaterialIcons name={icon} size={22} color={theme.colors.textMuted} />
          </View>
        )}
        <TextInput
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          editable={editable}
          keyboardType={resolvedKeyboard}
          style={[
            styles.input,
            {
              backgroundColor: theme.mode === 'dark' ? theme.colors.slate800 : theme.colors.slate50,
              color: theme.colors.text,
              paddingLeft: icon ? 48 : 16,
              paddingRight: isPassword ? 48 : 16,
            },
            style,
          ]}
          {...props}
        />
        {isPassword && onTogglePassword && (
          <TouchableOpacity onPress={onTogglePassword} style={styles.rightIcon} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <MaterialIcons
              name={showPassword ? 'visibility' : 'visibility-off'}
              size={22}
              color={theme.colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 4, width: '100%' },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputRow: { position: 'relative', width: '100%' },
  input: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    fontSize: 16,
  },
  leftIconWrap: { position: 'absolute', left: 16, top: 17, zIndex: 2 },
  rightIcon: { position: 'absolute', right: 16, top: 17, zIndex: 2 },
  error: { color: '#ef4444', fontSize: 12, marginTop: 4, marginLeft: 4 },
});
