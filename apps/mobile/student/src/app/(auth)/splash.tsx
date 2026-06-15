import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store';
import { APP_NAME, SCHOOL_NAME, SCHOOL_LOGO_URI } from '@/constants/config';

export default function SplashScreen() {
  const theme = useTheme();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [progress, setProgress] = useState(0);

  const logoScale = useSharedValue(0.85);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const barWidth = useSharedValue(0);
  const syncRotation = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 600 });
    logoScale.value = withSpring(1, { damping: 12, stiffness: 90 });
    textOpacity.value = withTiming(1, { duration: 500 });
    syncRotation.value = withRepeat(withTiming(360, { duration: 2000, easing: Easing.linear }), -1);
  }, [logoOpacity, logoScale, textOpacity, syncRotation]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return Math.min(100, p + 4);
      });
    }, 70);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    barWidth.value = withTiming(progress, { duration: 280, easing: Easing.out(Easing.cubic) });
  }, [progress, barWidth]);

  useEffect(() => {
    if (progress >= 100 && !isLoading) {
      const t = setTimeout(() => {
        router.replace(isAuthenticated ? '/(tabs)' : '/(auth)/login');
      }, 350);
      return () => clearTimeout(t);
    }
  }, [progress, router, isAuthenticated, isLoading]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));
  const barStyle = useAnimatedStyle(() => ({ width: `${barWidth.value}%` }));
  const syncStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${syncRotation.value}deg` }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.decorTop, { backgroundColor: `${theme.colors.primary}0d` }]} />
      <View style={[styles.decorBottom, { backgroundColor: `${theme.colors.primary}0d` }]} />
      <View style={[styles.decorCircle, { borderColor: `${theme.colors.primary}1a` }]} />

      <View style={styles.content}>
        <Animated.View style={[styles.logoWrap, { backgroundColor: theme.colors.card, borderColor: `${theme.colors.primary}33` }, logoStyle]}>
          <Image source={{ uri: SCHOOL_LOGO_URI }} style={styles.logo} resizeMode="contain" accessibilityLabel="School logo" />
        </Animated.View>

        <Animated.View style={[styles.textBlock, textStyle]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{APP_NAME}</Text>
          <View style={styles.subtitleRow}>
            <MaterialIcons name="school" size={20} color={theme.colors.primary} />
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Educational Management</Text>
          </View>
          <Text style={[styles.school, { color: theme.colors.primary }]}>{SCHOOL_NAME.toUpperCase()}</Text>
        </Animated.View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <View style={styles.progressLabel}>
              <Animated.View style={syncStyle}>
                <MaterialIcons name="sync" size={16} color={theme.colors.primary} />
              </Animated.View>
              <Text style={[styles.progressText, { color: theme.colors.text }]}>Initializing modules...</Text>
            </View>
            <Text style={[styles.progressPercent, { color: theme.colors.primary }]}>{progress}%</Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: `${theme.colors.primary}1a`, borderColor: `${theme.colors.primary}1a` }]}>
            <Animated.View style={[styles.progressFill, { backgroundColor: theme.colors.primary }, barStyle]} />
          </View>
        </View>

        <Text style={[styles.footer, { color: theme.colors.textMuted }]}>POWERED BY IDPS DIGITAL SOLUTIONS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  decorTop: { position: 'absolute', top: 0, left: 0, width: 128, height: 128, borderBottomRightRadius: 999 },
  decorBottom: { position: 'absolute', bottom: 0, right: 0, width: 192, height: 192, borderTopLeftRadius: 999 },
  decorCircle: { position: 'absolute', top: '22%', right: -40, width: 80, height: 80, borderRadius: 40, borderWidth: 4 },
  content: { width: '100%', maxWidth: 400, paddingHorizontal: 24, alignItems: 'center' },
  logoWrap: {
    width: 192,
    height: 192,
    borderRadius: 96,
    borderWidth: 4,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: { width: '100%', height: '100%' },
  textBlock: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 36, fontWeight: '700', letterSpacing: -0.5, marginBottom: 8 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  subtitle: { fontSize: 18, fontWeight: '500' },
  school: { fontSize: 10, fontWeight: '600', letterSpacing: 3 },
  progressSection: { width: '100%', maxWidth: 320 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressText: { fontSize: 14, fontWeight: '500' },
  progressPercent: { fontSize: 14, fontWeight: '700' },
  progressTrack: { height: 12, borderRadius: 999, overflow: 'hidden', borderWidth: 1 },
  progressFill: { height: '100%', borderRadius: 999 },
  footer: { marginTop: 64, fontSize: 10, letterSpacing: 3 },
});
