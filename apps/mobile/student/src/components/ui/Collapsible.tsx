import { useEffect, type ReactNode } from 'react';
import { View, type LayoutChangeEvent, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const DEFAULT_DURATION = 280;

interface CollapsibleProps {
  expanded: boolean;
  children: ReactNode;
  duration?: number;
}

export function Collapsible({ expanded, children, duration = DEFAULT_DURATION }: CollapsibleProps) {
  const height = useSharedValue(0);
  const contentHeight = useSharedValue(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.height;
    if (measured > 0) {
      contentHeight.value = measured;
      if (expanded) {
        height.value = withTiming(measured, { duration, easing: Easing.out(Easing.cubic) });
      }
    }
  };

  useEffect(() => {
    const easing = expanded ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic);
    height.value = withTiming(expanded ? contentHeight.value : 0, { duration, easing });
  }, [expanded, contentHeight, duration, height]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View onLayout={onLayout}>{children}</View>
    </Animated.View>
  );
}

interface AnimatedChevronProps {
  expanded: boolean;
  color: string;
  size?: number;
  duration?: number;
}

export function AnimatedChevron({ expanded, color, size = 22, duration = DEFAULT_DURATION }: AnimatedChevronProps) {
  const rotation = useSharedValue(expanded ? 180 : 0);

  useEffect(() => {
    rotation.value = withTiming(expanded ? 180 : 0, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [duration, expanded, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <MaterialIcons name="expand-more" size={size} color={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
});
