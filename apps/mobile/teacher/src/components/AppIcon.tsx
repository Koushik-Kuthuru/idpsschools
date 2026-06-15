import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/theme';
import { getIcon } from '@/utils/icons';

interface AppIconProps {
  name: string;
  size?: number;
  color?: string;
  filled?: boolean;
}

export function AppIcon({ name, size = 24, color = colors.onSurface, filled }: AppIconProps) {
  const iconName = getIcon(name);
  return <MaterialIcons name={iconName} size={size} color={color} />;
}
