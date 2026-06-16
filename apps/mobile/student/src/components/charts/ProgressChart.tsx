import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';

interface CircularProgressProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
}

export function CircularProgress({ percent, size = 160, strokeWidth = 12 }: CircularProgressProps) {
  const theme = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G transform={`rotate(-90 ${center} ${center})`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={`${theme.colors.primary}1a`}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={theme.colors.primary}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.percent, { color: theme.colors.text }]}>{percent}%</Text>
      </View>
    </View>
  );
}

interface ProgressBarProps {
  percent: number;
  height?: number;
  color?: string;
}

export function ProgressBar({ percent, height = 8, color }: ProgressBarProps) {
  const theme = useTheme();
  const fillColor = color ?? theme.colors.primary;

  return (
    <View style={[styles.barBg, { height, backgroundColor: `${theme.colors.primary}1a` }]}>
      <View style={[styles.barFill, { width: `${Math.min(100, percent)}%`, height, backgroundColor: fillColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute' },
  percent: { fontSize: 36, fontWeight: '700' },
  barBg: { width: '100%', borderRadius: 999, overflow: 'hidden' },
  barFill: { borderRadius: 999 },
});
