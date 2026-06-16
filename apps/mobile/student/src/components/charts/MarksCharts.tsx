import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';

const CHART_PAD = { top: 12, right: 8, bottom: 8, left: 32 };

function scaleY(value: number, min: number, max: number, chartH: number, top: number) {
  const range = max - min || 1;
  return top + chartH - ((value - min) / range) * chartH;
}

interface TermLineChartProps {
  labels: string[];
  values: number[];
  height?: number;
}

/** Term-over-term % trend — works on web, iOS, and Android. */
export function TermLineChart({ labels, values, height = 168 }: TermLineChartProps) {
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const width = screenWidth - 56;

  const { points, polyline, yTicks, min, max } = useMemo(() => {
    const chartW = width - CHART_PAD.left - CHART_PAD.right;
    const chartH = height - CHART_PAD.top - CHART_PAD.bottom - 22;
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    const minVal = Math.max(0, Math.floor((dataMin - 8) / 5) * 5);
    const maxVal = Math.min(100, Math.ceil((dataMax + 8) / 5) * 5);
    const range = maxVal - minVal || 1;

    const pts = values.map((v, i) => {
      const x = CHART_PAD.left + (values.length === 1 ? chartW / 2 : (i / (values.length - 1)) * chartW);
      const y = scaleY(v, minVal, maxVal, chartH, CHART_PAD.top);
      return { x, y, v };
    });

    const ticks: number[] = [];
    const step = range <= 20 ? 5 : 10;
    for (let t = minVal; t <= maxVal; t += step) ticks.push(t);

    return {
      points: pts,
      polyline: pts.map((p) => `${p.x},${p.y}`).join(' '),
      yTicks: ticks,
      min: minVal,
      max: maxVal,
    };
  }, [values, width, height]);

  const chartH = height - CHART_PAD.top - CHART_PAD.bottom - 22;

  return (
    <View style={styles.wrap}>
      <Svg width={width} height={height - 22}>
        {yTicks.map((tick) => {
          const y = scaleY(tick, min, max, chartH, CHART_PAD.top);
          return (
            <React.Fragment key={tick}>
              <Line
                x1={CHART_PAD.left}
                y1={y}
                x2={width - CHART_PAD.right}
                y2={y}
                stroke={theme.colors.border}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            </React.Fragment>
          );
        })}

        <Polyline
          points={polyline}
          fill="none"
          stroke={theme.colors.primary}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((p, i) => (
          <Circle
            key={`${labels[i]}-${p.v}`}
            cx={p.x}
            cy={p.y}
            r={5}
            fill={theme.colors.card}
            stroke={theme.colors.primary}
            strokeWidth={2.5}
          />
        ))}
      </Svg>

      <View style={[styles.xLabels, { width }]}>
        {labels.map((label, i) => (
          <View key={label} style={styles.xLabelCell}>
            <Text style={[styles.xLabel, { color: theme.colors.textMuted }]} numberOfLines={1}>
              {label}
            </Text>
            <Text style={[styles.xValue, { color: theme.colors.primary }]}>{values[i]}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

interface SubjectBarChartProps {
  labels: string[];
  values: number[];
  height?: number;
}

/** Subject % bars for the selected term. */
export function SubjectBarChart({ labels, values, height = 188 }: SubjectBarChartProps) {
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const width = screenWidth - 56;
  const barAreaH = height - 36;
  const barGap = 8;
  const barCount = values.length;
  const barWidth = (width - barGap * (barCount + 1)) / barCount;

  return (
    <View style={[styles.wrap, { width }]}>
      <Svg width={width} height={height}>
        {values.map((value, i) => {
          const barH = Math.max(6, (value / 100) * barAreaH);
          const x = barGap + i * (barWidth + barGap);
          const y = 8 + barAreaH - barH;
          return (
            <Rect
              key={`${labels[i]}-${value}`}
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx={6}
              fill={theme.colors.primary}
            />
          );
        })}
      </Svg>

      <View style={[styles.barLabels, { width }]}>
        {labels.map((label, i) => (
          <View key={label} style={[styles.barLabelCell, { width: barWidth, marginHorizontal: barGap / 2 }]}>
            <Text style={[styles.barValue, { color: theme.colors.primary }]}>{values[i]}%</Text>
            <Text style={[styles.barLabel, { color: theme.colors.textMuted }]} numberOfLines={1}>
              {label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'center' },
  xLabels: { flexDirection: 'row', marginTop: 4 },
  xLabelCell: { flex: 1, alignItems: 'center' },
  xLabel: { fontSize: 10, fontWeight: '600' },
  xValue: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  barLabels: { flexDirection: 'row', justifyContent: 'center', marginTop: 6 },
  barLabelCell: { alignItems: 'center' },
  barValue: { fontSize: 11, fontWeight: '700' },
  barLabel: { fontSize: 10, fontWeight: '600', marginTop: 2, textAlign: 'center' },
});
