import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Button } from '@/components/ui/Button';

export default function OfflineScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { isConnected, isSyncing, pendingCount, syncPending, refreshPendingCount } = useNetworkStatus();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.iconWrap, { backgroundColor: `${theme.colors.primary}1a` }]}>
        <MaterialIcons name={isConnected ? 'cloud-sync' : 'wifi-off'} size={64} color={theme.colors.primary} />
      </View>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {isConnected ? 'Back Online' : "You're Offline"}
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        {isConnected
          ? 'Connection restored. Sync pending actions and cached screens.'
          : 'No internet connection. Viewing cached data with limited features.'}
      </Text>

      <View style={[styles.statusCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <StatusRow label="Network" value={isConnected ? 'Connected' : 'Disconnected'} ok={isConnected} theme={theme} />
        <StatusRow label="Cached screens" value="Available" ok theme={theme} />
        <StatusRow label="Pending actions" value={String(pendingCount)} ok={pendingCount === 0} theme={theme} />
        <StatusRow label="Sync" value={isSyncing ? 'In progress...' : 'Idle'} ok={!isSyncing} theme={theme} />
      </View>

      {isSyncing ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 24 }} />
      ) : (
        <Button
          title={isConnected ? 'SYNC NOW' : 'TRY AGAIN'}
          onPress={async () => {
            await refreshPendingCount();
            if (isConnected) await syncPending();
            else router.back();
          }}
          style={{ marginTop: 24, width: '100%' }}
        />
      )}

      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
        <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Continue Browsing</Text>
      </TouchableOpacity>
    </View>
  );
}

function StatusRow({ label, value, ok, theme }: { label: string; value: string; ok: boolean; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.statusRow}>
      <Text style={{ color: theme.colors.textSecondary }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <MaterialIcons name={ok ? 'check-circle' : 'schedule'} size={16} color={ok ? theme.colors.primary : theme.colors.amber500} />
        <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconWrap: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 12 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  statusCard: { width: '100%', padding: 20, borderRadius: 12, borderWidth: 1 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
});
