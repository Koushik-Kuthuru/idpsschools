import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  /** When router has no history (e.g. opened from tab menu), go here instead */
  fallbackRoute?: string;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({ title, showBack = true, onBack, fallbackRoute = '/(tabs)/profile', rightAction }: ScreenHeaderProps) {
  const theme = useTheme();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else if (fallbackRoute) {
      router.replace(fallbackRoute as '/(tabs)/profile');
    }
  };

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.mode === 'dark' ? `${theme.colors.backgroundDark}cc` : `${theme.colors.backgroundLight}cc`,
          borderBottomColor: `${theme.colors.primary}1a`,
        },
      ]}
    >
      {showBack ? (
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}
      <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
        {title}
      </Text>
      {rightAction ?? <View style={styles.spacer} />}
    </View>
  );
}

export function LoadingScreen() {
  const theme = useTheme();
  return (
    <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
      <View style={styles.skeletonHeader}>
        <Skeleton width="60%" height={24} borderRadius={8} />
      </View>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

export function ErrorScreen({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
      <MaterialIcons name="error-outline" size={48} color={theme.colors.red500} />
      <Text style={[styles.errorText, { color: theme.colors.text }]}>{message}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry}>
          <Text style={{ color: theme.colors.primary, fontWeight: '600', marginTop: 12 }}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  spacer: { width: 40 },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    paddingRight: 40,
  },
  loadingContainer: { 
    flex: 1, 
    padding: 16 
  },
  skeletonHeader: {
    marginBottom: 24,
    marginTop: 8,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { marginTop: 12, fontSize: 16, textAlign: 'center', paddingHorizontal: 24 },
});
