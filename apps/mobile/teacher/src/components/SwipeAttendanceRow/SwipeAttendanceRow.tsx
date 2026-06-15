import React, { useRef } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import {
  PanGestureHandler,
  State,
  type PanGestureHandlerGestureEvent,
  type PanGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { AppIcon } from '../AppIcon';
import { colors, textStyle } from '@/theme';
import { MAX_SWIPE_DRAG, SWIPE_THRESHOLD, styles } from './SwipeAttendanceRow.styles';
import type { SwipeAttendanceRowProps } from './SwipeAttendanceRow.types';

export function SwipeAttendanceRow({
  name,
  rollNo,
  className,
  avatarUrl,
  status,
  onStatusChange,
}: SwipeAttendanceRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const leftOpacity = useRef(new Animated.Value(0)).current;
  const rightOpacity = useRef(new Animated.Value(0)).current;

  const cardStyle = [
    styles.card,
    status === 'present' && styles.cardPresent,
    status === 'absent' && styles.cardAbsent,
    status === 'late' && styles.cardLate,
  ];

  const snapBack = () => {
    Animated.parallel([
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 8 }),
      Animated.timing(leftOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(rightOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const applySwipe = (dx: number) => {
    if (dx > SWIPE_THRESHOLD) {
      onStatusChange('present');
    } else if (dx < -SWIPE_THRESHOLD) {
      onStatusChange('absent');
    }
    snapBack();
  };

  const updateDrag = (dx: number) => {
    const limited = Math.sign(dx) * Math.min(Math.abs(dx), MAX_SWIPE_DRAG);
    translateX.setValue(limited);
    if (limited > 0) {
      rightOpacity.setValue(Math.min(limited / SWIPE_THRESHOLD, 1));
      leftOpacity.setValue(0);
    } else if (limited < 0) {
      leftOpacity.setValue(Math.min(Math.abs(limited) / SWIPE_THRESHOLD, 1));
      rightOpacity.setValue(0);
    } else {
      leftOpacity.setValue(0);
      rightOpacity.setValue(0);
    }
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    {
      useNativeDriver: true,
      listener: (event: PanGestureHandlerGestureEvent) => {
        updateDrag(event.nativeEvent.translationX);
      },
    },
  );

  const onHandlerStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    const { state, translationX: tx } = event.nativeEvent;
    if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
      applySwipe(tx);
    }
  };

  const toggleLate = () => {
    onStatusChange(status === 'late' ? 'present' : 'late');
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.actionLeft, { opacity: leftOpacity }]} pointerEvents="none">
        <AppIcon name="close" color={colors.onPrimary} />
        <Text style={[textStyle('labelLg'), styles.actionLabel]}>Absent</Text>
      </Animated.View>
      <Animated.View style={[styles.actionRight, { opacity: rightOpacity }]} pointerEvents="none">
        <Text style={[textStyle('labelLg'), styles.actionLabel]}>Present</Text>
        <AppIcon name="check" color={colors.onPrimary} />
      </Animated.View>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-12, 12]}
        failOffsetY={[-14, 14]}
      >
        <Animated.View style={[cardStyle, { transform: [{ translateX }] }]}>
          <View style={styles.left}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
            <View>
              <Text style={[textStyle('studentName'), styles.name]}>{name}</Text>
              <View style={styles.meta}>
                <View style={styles.rollChip}>
                  <Text style={[textStyle('chip10'), styles.rollText]}>Roll: {rollNo}</Text>
                </View>
                <Text style={[textStyle('chip10'), styles.classText]}>{className}</Text>
              </View>
            </View>
          </View>
          <View style={styles.rightActions}>
            <TouchableOpacity
              style={[styles.lateBtn, status === 'late' && styles.lateBtnActive]}
              onPress={toggleLate}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppIcon
                name="access_time"
                size={20}
                color={status === 'late' ? colors.late : colors.outline}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}
