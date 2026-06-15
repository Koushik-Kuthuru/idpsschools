import React from 'react';
import { View, Text } from 'react-native';
import { AppButton, AppHeader, AppIcon, ScreenLayout } from '@/components';
import { useAppStore } from '@/store/appStore';
import { colors, textStyle } from '@/theme';
import { styles } from './OfflineModeIndicatorScreen.styles';
import type { OfflineModeIndicatorScreenProps } from './OfflineModeIndicatorScreen.types';

export function OfflineModeIndicatorScreen(_props: OfflineModeIndicatorScreenProps) {
  const isOffline = useAppStore((s) => s.isOffline);
  const setOffline = useAppStore((s) => s.setOffline);

  return (
    <ScreenLayout header={<AppHeader variant="back" title="Offline Mode" />}>
      <View style={styles.content}>
        <View style={styles.banner}>
          <AppIcon name="cloud_off" color={colors.onPrimary} size={40} />
          <Text style={[textStyle('headlineMd'), styles.bannerTitle]}>
            {isOffline ? 'You are offline' : 'You are online'}
          </Text>
          <Text style={[textStyle('bodyMd'), styles.bannerBody]}>
            Attendance and marks will sync when connection is restored.
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={[textStyle('bodyMd'), styles.cardText]}>
            Toggle offline simulation to test cached workflows.
          </Text>
        </View>
        <AppButton
          label={isOffline ? 'Go Online' : 'Simulate Offline'}
          variant={isOffline ? 'primary' : 'outline'}
          onPress={() => setOffline(!isOffline)}
        />
      </View>
    </ScreenLayout>
  );
}
