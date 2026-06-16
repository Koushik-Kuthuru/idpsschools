import React, { useEffect } from 'react';
import { View, StyleSheet, DimensionValue } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonProps) {
  const theme = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 600 }),
        withTiming(0.3, { duration: 600 })
      ),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const backgroundColor = theme.mode === 'dark' ? '#333333' : '#E1E9EE';

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
      <View style={styles.row}>
         <Skeleton width={48} height={48} borderRadius={24} />
         <View style={styles.col}>
           <Skeleton width="70%" height={16} style={{ marginBottom: 12 }} />
           <Skeleton width="40%" height={14} />
         </View>
      </View>
      <Skeleton width="100%" height={12} style={{ marginTop: 16 }} />
      <Skeleton width="80%" height={12} style={{ marginTop: 8 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  col: {
    marginLeft: 16,
    flex: 1,
  }
});

export function ProfileSkeleton() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ alignItems: 'center', padding: 24 }}>
         <Skeleton width={128} height={128} borderRadius={64} style={{ marginBottom: 16 }} />
         <Skeleton width={160} height={24} style={{ marginBottom: 8 }} />
         <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
           <Skeleton width={80} height={20} borderRadius={10} />
           <Skeleton width={80} height={20} borderRadius={10} />
           <Skeleton width={80} height={20} borderRadius={10} />
         </View>
         <Skeleton width={140} height={36} borderRadius={12} />
      </View>
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

export function MarksSkeleton() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
       <Skeleton width={140} height={32} borderRadius={10} style={{ marginBottom: 12 }} />
       <Skeleton width="100%" height={140} borderRadius={16} style={{ marginBottom: 12 }} />
       <Skeleton width="100%" height={90} borderRadius={14} style={{ marginBottom: 24 }} />
       <Skeleton width={120} height={20} style={{ marginBottom: 12 }} />
       <Skeleton width="100%" height={160} borderRadius={14} style={{ marginBottom: 24 }} />
       <SkeletonCard />
       <SkeletonCard />
    </View>
  );
}

export function TimetableSkeleton() {
  return (
    <View style={{ flex: 1 }}>
       <Skeleton width="100%" height={140} borderRadius={0} style={{ marginBottom: 24 }} />
       <View style={{ paddingHorizontal: 16 }}>
         <SkeletonCard />
         <SkeletonCard />
         <SkeletonCard />
         <SkeletonCard />
       </View>
    </View>
  );
}

export function ExamScheduleSkeleton() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
       <Skeleton width="100%" height={120} borderRadius={16} style={{ marginBottom: 12 }} />
       <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
          <Skeleton width="31%" height={80} borderRadius={14} />
          <Skeleton width="31%" height={80} borderRadius={14} />
          <Skeleton width="31%" height={80} borderRadius={14} />
       </View>
       <Skeleton width={120} height={20} style={{ marginBottom: 12 }} />
       <Skeleton width="100%" height={100} borderRadius={14} style={{ marginBottom: 10 }} />
       <Skeleton width="100%" height={100} borderRadius={14} style={{ marginBottom: 10 }} />
       <Skeleton width="100%" height={100} borderRadius={14} style={{ marginBottom: 10 }} />
    </View>
  );
}

export function CourseDetailSkeleton() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
       <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
         <Skeleton width="100%" height={70} borderRadius={14} style={{ flex: 1 }} />
         <Skeleton width="100%" height={70} borderRadius={14} style={{ flex: 1 }} />
       </View>
       <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
         <Skeleton width="100%" height={90} borderRadius={14} style={{ flex: 1 }} />
         <Skeleton width="100%" height={90} borderRadius={14} style={{ flex: 1 }} />
       </View>
       <Skeleton width={140} height={24} style={{ marginBottom: 14 }} />
       <Skeleton width="100%" height={60} style={{ marginBottom: 10 }} />
       <Skeleton width="100%" height={60} style={{ marginBottom: 10 }} />
    </View>
  );
}

