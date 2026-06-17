import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components';
import { stitchImages } from '@/assets/images';
import { colors } from '@/theme';
import { styles } from './SplashScreen.styles';
import type { SplashScreenProps } from './SplashScreen.types';

export function SplashScreen({ navigation }: SplashScreenProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const listener = progress.addListener(({ value }) => setPct(Math.round(value * 100)));
    Animated.timing(progress, { toValue: 0.6, duration: 2000, useNativeDriver: false }).start();
    const timer = setTimeout(() => navigation.replace('TeacherLogin'), 2500);
    return () => {
      clearTimeout(timer);
      progress.removeListener(listener);
    };
  }, [navigation, progress]);

  const fillWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.decorTop} />
      <View style={styles.decorBottom} />
      <View style={styles.center}>
        <View style={styles.logoRing}>
          <Image source={{ uri: stitchImages.splashLogo }} style={styles.logo} contentFit="contain" />
        </View>
        <View style={styles.branding}>
          <Text style={styles.title}>ERP SYSTEM</Text>
          <View style={styles.taglineRow}>
            <AppIcon name="school" size={20} color={colors.primary} />
            <Text style={styles.tagline}>Staff Portal</Text>
          </View>
          <Text style={styles.school}>INTERNATIONAL DELHI PUBLIC SCHOOL</Text>
        </View>
      </View>
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <View style={styles.progressLabelRow}>
            <AppIcon name="sync" size={18} color={colors.primary} />
            <Text style={styles.progressLabel}>Initializing staff modules...</Text>
          </View>
          <Text style={styles.progressPct}>{pct}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: fillWidth }]} />
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.version}>POWERED BY IDPS DIGITAL SOLUTIONS</Text>
      </View>
    </SafeAreaView>
  );
}
