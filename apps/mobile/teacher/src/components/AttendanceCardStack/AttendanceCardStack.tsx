import React, { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import {
  PanGestureHandler,
  State,
  type PanGestureHandlerGestureEvent,
  type PanGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import { AppIcon } from '../AppIcon';
import { AttendanceProfileCard } from '../AttendanceProfileCard/AttendanceProfileCard';
import { colors, textStyle } from '@/theme';
import { FLY_DISTANCE, SWIPE_THRESHOLD, styles } from './AttendanceCardStack.styles';
import type { AttendanceCardStackProps, StackStudent } from './AttendanceCardStack.types';
import type { AttendanceStatus } from '@/types';

type HistoryEntry = { studentId: string; previousStatus: AttendanceStatus };

export type AttendanceCardStackRef = {
  markPresent: () => void;
  markAbsent: () => void;
  markLate: () => void;
  undo: () => void;
};

type SwipeDirection = 'left' | 'right' | 'up';

function SwipableProfileCard({
  student,
  onDismiss,
}: {
  student: StackStudent;
  onDismiss: (status: AttendanceStatus) => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const presentOpacity = useRef(new Animated.Value(0)).current;
  const absentOpacity = useRef(new Animated.Value(0)).current;
  const flying = useRef(false);

  const rotate = translateX.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ['-20deg', '0deg', '20deg'],
  });

  const updateIndicators = (dx: number) => {
    if (dx > 50) {
      presentOpacity.setValue(Math.min(dx / 150, 1));
      absentOpacity.setValue(0);
    } else if (dx < -50) {
      absentOpacity.setValue(Math.min(Math.abs(dx) / 150, 1));
      presentOpacity.setValue(0);
    } else {
      presentOpacity.setValue(0);
      absentOpacity.setValue(0);
    }
  };

  const resetPosition = () => {
    Animated.parallel([
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 8 }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8 }),
      Animated.timing(presentOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(absentOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const flyOff = useCallback(
    (direction: SwipeDirection, status: AttendanceStatus) => {
      if (flying.current) return;
      flying.current = true;
      const toX = direction === 'right' ? FLY_DISTANCE : direction === 'left' ? -FLY_DISTANCE : 0;
      const toY = direction === 'up' ? -FLY_DISTANCE : 0;
      Animated.parallel([
        Animated.timing(translateX, { toValue: toX, duration: 320, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: toY, duration: 320, useNativeDriver: true }),
        Animated.timing(presentOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.timing(absentOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
      ]).start(() => {
        translateX.setValue(0);
        translateY.setValue(0);
        flying.current = false;
        onDismiss(status);
      });
    },
    [absentOpacity, onDismiss, presentOpacity, translateX, translateY],
  );

  const resolveSwipe = (dx: number, dy: number) => {
    if (dx > SWIPE_THRESHOLD) flyOff('right', 'present');
    else if (dx < -SWIPE_THRESHOLD) flyOff('left', 'absent');
    else if (dy < -SWIPE_THRESHOLD && Math.abs(dx) < SWIPE_THRESHOLD) flyOff('up', 'late');
    else resetPosition();
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    {
      useNativeDriver: true,
      listener: (event: PanGestureHandlerGestureEvent) => {
        updateIndicators(event.nativeEvent.translationX);
      },
    },
  );

  const onHandlerStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    const { state, translationX: tx, translationY: ty } = event.nativeEvent;
    if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
      resolveSwipe(tx, ty);
    }
  };

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      activeOffsetX={[-15, 15]}
      activeOffsetY={[-15, 15]}
    >
      <Animated.View
        style={[
          styles.swipableWrap,
          {
            transform: [{ translateX }, { translateY }, { rotate }],
          },
        ]}
      >
        <Animated.View
          style={[styles.indicator, styles.indicatorPresent, { opacity: presentOpacity }]}
          pointerEvents="none"
        >
          <Text style={[textStyle('labelLg'), styles.indicatorTextPresent]}>PRESENT</Text>
        </Animated.View>
        <Animated.View
          style={[styles.indicator, styles.indicatorAbsent, { opacity: absentOpacity }]}
          pointerEvents="none"
        >
          <Text style={[textStyle('labelLg'), styles.indicatorTextAbsent]}>ABSENT</Text>
        </Animated.View>
        <AttendanceProfileCard
          name={student.name}
          rollNo={student.rollNo}
          className={student.className}
          avatarUrl={student.avatarUrl}
          attendancePercent={student.attendancePercent}
          status={student.status}
        />
      </Animated.View>
    </PanGestureHandler>
  );
}

const STACK_SLOTS = [
  { offset: 2, style: styles.cardSlotBack2 },
  { offset: 1, style: styles.cardSlotBack1 },
  { offset: 0, style: styles.cardSlotTop },
] as const;

export const AttendanceCardStack = forwardRef<AttendanceCardStackRef, AttendanceCardStackProps>(
  function AttendanceCardStack({ students, onMark, onIndexChange, onHistoryChange }, ref) {
    const [index, setIndex] = useState(0);
    const [history, setHistory] = useState<HistoryEntry[]>([]);

    useEffect(() => {
      onIndexChange?.(index);
    }, [index, onIndexChange]);

    useEffect(() => {
      onHistoryChange?.(history.length);
    }, [history.length, onHistoryChange]);

    const advance = useCallback(
      (studentId: string, status: AttendanceStatus, previousStatus: AttendanceStatus) => {
        onMark(studentId, status);
        setHistory((h) => [...h, { studentId, previousStatus }]);
        setIndex((i) => i + 1);
      },
      [onMark],
    );

    const dismissTop = useCallback(
      (status: AttendanceStatus) => {
        const student = students[index];
        if (!student) return;
        advance(student.id, status, student.status);
      },
      [advance, index, students],
    );

    const markPresent = useCallback(() => dismissTop('present'), [dismissTop]);
    const markAbsent = useCallback(() => dismissTop('absent'), [dismissTop]);
    const markLate = useCallback(() => dismissTop('late'), [dismissTop]);

    const undo = useCallback(() => {
      const last = history[history.length - 1];
      if (!last) return;
      onMark(last.studentId, last.previousStatus);
      setHistory((h) => h.slice(0, -1));
      setIndex((i) => Math.max(0, i - 1));
    }, [history, onMark]);

    useImperativeHandle(ref, () => ({ markPresent, markAbsent, markLate, undo }), [
      markPresent,
      markAbsent,
      markLate,
      undo,
    ]);

    if (index >= students.length) {
      return (
        <View style={styles.empty}>
          <AppIcon name="check_circle" size={48} color={colors.primaryContainer} />
          <Text style={[textStyle('headlineSm'), styles.emptyText, { marginTop: 12 }]}>
            All students marked
          </Text>
          <Text style={[textStyle('bodyMd'), styles.emptyText]}>
            Review attendance before submitting.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.deck}>
        {STACK_SLOTS.map(({ offset, style: slotStyle }) => {
          const student = students[index + offset];
          if (!student) return null;
          const isTop = offset === 0;
          return (
            <View
              key={`${student.id}-${offset}`}
              style={[styles.cardSlot, slotStyle]}
              pointerEvents={isTop ? 'auto' : 'none'}
            >
              {isTop ? (
                <SwipableProfileCard student={student} onDismiss={dismissTop} />
              ) : (
                <AttendanceProfileCard
                  name={student.name}
                  rollNo={student.rollNo}
                  className={student.className}
                  avatarUrl={student.avatarUrl}
                  attendancePercent={student.attendancePercent}
                />
              )}
            </View>
          );
        })}
      </View>
    );
  },
);

export function AttendanceStackActions({
  stackRef,
  canUndo,
}: {
  stackRef: React.RefObject<AttendanceCardStackRef | null>;
  canUndo: boolean;
}) {
  return (
    <View style={styles.actions}>
      <TouchableOpacity
        style={[styles.actionBtn, styles.actionUndo]}
        onPress={() => stackRef.current?.undo()}
        disabled={!canUndo}
        activeOpacity={0.85}
      >
        <AppIcon name="rotate_left" size={24} color={canUndo ? colors.outline : colors.outlineVariant} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionBtn, styles.actionAbsent]}
        onPress={() => stackRef.current?.markAbsent()}
        activeOpacity={0.85}
      >
        <AppIcon name="close" size={32} color={colors.absent} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionBtn, styles.actionLate]}
        onPress={() => stackRef.current?.markLate()}
        activeOpacity={0.85}
      >
        <AppIcon name="access_time" size={28} color={colors.late} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionBtn, styles.actionPresent]}
        onPress={() => stackRef.current?.markPresent()}
        activeOpacity={0.85}
      >
        <AppIcon name="check" size={32} color={colors.primaryContainer} />
      </TouchableOpacity>
    </View>
  );
}
