import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store';

export default function ResetSuccessScreen() {
  const theme = useTheme();
  const router = useRouter();
  const clearResetContact = useAuthStore((s) => s.clearResetContact);
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [scale]);

  const goLogin = () => {
    clearResetContact();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.content}>
        <Animated.View style={[styles.iconWrap, { backgroundColor: `${theme.colors.primary}1a`, transform: [{ scale }] }]}>
          <MaterialIcons name="check-circle" size={72} color={theme.colors.primary} />
        </Animated.View>
        <Text style={[styles.title, { color: theme.colors.text }]}>Password Reset Successful</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Your password has been updated. You can now sign in with your new credentials.
        </Text>
        <Button title="GO TO LOGIN" onPress={goLogin} icon="login" style={{ marginTop: 32, width: '100%' }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center' },
  iconWrap: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 24 },
});
