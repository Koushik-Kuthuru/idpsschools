import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useRouter } from 'expo-router';

export function OfflineBanner() {
  const theme = useTheme();
  const router = useRouter();
  const { isConnected, isSyncing, pendingCount, syncPending } = useNetworkStatus();

  if (isConnected && pendingCount === 0) return null;

  return (
    <View style={[styles.banner, { backgroundColor: `${theme.colors.primary}1a`, borderColor: `${theme.colors.primary}33` }]}>
      <View style={styles.left}>
        <MaterialIcons name="signal-wifi-off" size={22} color={theme.colors.primary} />
        <View>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {isConnected ? 'Syncing data...' : "You're Offline"}
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
            {isConnected
              ? `${pendingCount} action(s) in queue`
              : 'Viewing cached data • Limited features'}
          </Text>
        </View>
      </View>
      {isSyncing ? (
        <ActivityIndicator color={theme.colors.primary} />
      ) : (
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: theme.colors.primary }]}
          onPress={() => (isConnected ? syncPending() : router.push('/offline'))}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>
            {isConnected ? 'Sync' : 'Details'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, marginHorizontal: 16, marginTop: 8, borderRadius: 12, borderWidth: 1 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  title: { fontWeight: '700', fontSize: 14 },
  btn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
});
