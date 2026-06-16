import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';

interface AttendanceRatioBarProps {
  present: number;
  absent: number;
  late: number;
  leave: number;
}

/** Stacked bar showing present / absent / late / leave split. */
export function AttendanceRatioBar({ present, absent, late, leave }: AttendanceRatioBarProps) {
  const theme = useTheme();
  const total = present + absent + late + leave || 1;
  const segments = [
    { key: 'present', value: present, color: theme.colors.primary },
    { key: 'absent', value: absent, color: theme.colors.red500 },
    { key: 'late', value: late, color: theme.colors.amber500 },
    { key: 'leave', value: leave, color: theme.colors.slate400 },
  ].filter((s) => s.value > 0);

  return (
    <View style={styles.ratioWrap}>
      <View style={[styles.ratioTrack, { backgroundColor: theme.colors.slate100 }]}>
        {segments.map((seg) => (
          <View
            key={seg.key}
            style={{
              flex: seg.value / total,
              backgroundColor: seg.color,
              height: '100%',
            }}
          />
        ))}
      </View>
      <View style={styles.legendRow}>
        {segments.map((seg) => (
          <View key={seg.key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
            <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
              {seg.key.charAt(0).toUpperCase() + seg.key.slice(1)} {Math.round((seg.value / total) * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

interface AttendanceRingProps {
  percent: number;
  target: number;
  size?: number;
}

/** Compact ring with % in center — used in hero card. */
export function AttendanceRing({ percent, target, size = 112 }: AttendanceRingProps) {
  const theme = useTheme();
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const onTarget = percent >= target;

  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G transform={`rotate(-90 ${center} ${center})`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={onTarget ? '#a2c144' : '#f59e0b'}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={styles.ringPercent}>{percent}%</Text>
        <Text style={styles.ringLabel}>overall</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ratioWrap: { gap: 10 },
  ratioTrack: { flexDirection: 'row', height: 10, borderRadius: 999, overflow: 'hidden' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontWeight: '600' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  ringPercent: { fontSize: 26, fontWeight: '800', color: '#fff' },
  ringLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 0.6 },
});
