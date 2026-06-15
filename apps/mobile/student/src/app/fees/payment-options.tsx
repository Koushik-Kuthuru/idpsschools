import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { usePaymentMethods, useFees } from '@/hooks/useApi';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { formatINR } from '@/utils/currency';

export default function PaymentOptionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: methods, isLoading, error, refetch } = usePaymentMethods();
  const { data: fees } = useFees();

  if (isLoading) return <LoadingScreen />;
  if (error || !methods) return <ErrorScreen message="Failed to load payment options" onRetry={() => refetch()} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScreenHeader title="Payment Options" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.amountCard, { backgroundColor: `${theme.colors.primary}1a`, borderColor: `${theme.colors.primary}33` }]}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Amount to Pay</Text>
          <Text style={[styles.amount, { color: theme.colors.primary }]}>{formatINR(fees?.dueAmount ?? 2650)}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Select Payment Method</Text>
        {methods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[styles.methodCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => router.push({ pathname: '/fees/make-payment', params: { method: method.id, methodName: method.name } })}
          >
            <View style={[styles.methodIcon, { backgroundColor: `${theme.colors.primary}1a` }]}>
              <MaterialIcons name={method.icon as keyof typeof MaterialIcons.glyphMap} size={28} color={theme.colors.primary} />
            </View>
            <View style={styles.methodInfo}>
              <Text style={[styles.methodName, { color: theme.colors.text }]}>{method.name}</Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{method.description}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={theme.colors.textMuted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16 },
  amountCard: { padding: 20, borderRadius: 12, borderWidth: 1, alignItems: 'center', marginBottom: 24 },
  amount: { fontSize: 36, fontWeight: '800', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  methodCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12, gap: 16 },
  methodIcon: { width: 56, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  methodInfo: { flex: 1 },
  methodName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
});
