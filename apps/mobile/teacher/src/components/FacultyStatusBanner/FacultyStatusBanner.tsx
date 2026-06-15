import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AppIcon } from '../AppIcon';
import { useAppStore } from '@/store/appStore';
import { colors, textStyle } from '@/theme';
import { styles } from './FacultyStatusBanner.styles';

interface FacultyStatusBannerProps {
  onRetry?: () => void;
  onViewQueue?: () => void;
  lastSync?: string;
  pendingCount?: number;
}

export function FacultyStatusBanner({
  onRetry,
  onViewQueue,
  lastSync = '5 mins ago',
  pendingCount = 0,
}: FacultyStatusBannerProps) {
  const isOffline = useAppStore((s) => s.isOffline);

  if (!isOffline) {
    return null;
  }

  return (
    <View style={styles.offline}>
      <View style={styles.offlineRow}>
        <AppIcon name="wifi_off" size={18} color={colors.error} />
        <View style={styles.offlineTextCol}>
          <Text style={[textStyle('labelLg'), styles.offlineTitle]}>OFFLINE (Cached Data)</Text>
          <Text style={[textStyle('labelSm'), styles.offlineSub]}>Last sync: {lastSync}</Text>
        </View>
      </View>
      {onRetry ? (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <Text style={[textStyle('labelSm'), styles.retryText]}>Retry Connection</Text>
        </TouchableOpacity>
      ) : null}
      {pendingCount > 0 && onViewQueue ? (
        <TouchableOpacity style={styles.queueLink} onPress={onViewQueue}>
          <Text style={[textStyle('labelSm'), styles.queueText]}>
            Pending sync ({pendingCount} items) · View Sync Queue
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
