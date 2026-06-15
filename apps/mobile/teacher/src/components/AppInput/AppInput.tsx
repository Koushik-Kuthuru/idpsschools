import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { AppIcon } from '../AppIcon';
import { colors, textStyle } from '@/theme';
import { styles } from './AppInput.styles';
import type { AppInputProps } from './AppInput.types';

export function AppInput({ label, icon, error, showPasswordToggle, secureTextEntry, ...rest }: AppInputProps) {
  const [hidden, setHidden] = useState(secureTextEntry ?? !!showPasswordToggle);

  return (
    <View style={styles.wrap}>
      <Text style={[textStyle('labelSm'), styles.label]}>{label}</Text>
      <View style={styles.inputWrap}>
        {icon ? (
          <View style={styles.icon}>
            <AppIcon name={icon} size={22} color={colors.outline} />
          </View>
        ) : null}
        <TextInput
          style={[textStyle('bodyMd'), styles.input, showPasswordToggle && styles.inputWithToggle]}
          placeholderTextColor={`${colors.outline}80`}
          secureTextEntry={showPasswordToggle ? hidden : secureTextEntry}
          {...rest}
        />
        {showPasswordToggle ? (
          <TouchableOpacity style={styles.toggle} onPress={() => setHidden((h) => !h)}>
            <AppIcon name={hidden ? 'visibility_off' : 'visibility'} size={22} color={colors.outline} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={[textStyle('labelSm'), styles.error]}>{error}</Text> : null}
    </View>
  );
}
