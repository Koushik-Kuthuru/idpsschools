import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useFees, useMakePayment } from '@/hooks/useApi';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/utils/currency';

export default function MakePaymentScreen() {
  const { method, methodName } = useLocalSearchParams<{ method: string; methodName: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { data: fees } = useFees();
  const payment = useMakePayment();
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');

  const amount = fees?.dueAmount ?? 2650;

  const handlePay = async () => {
    try {
      const result = await payment.mutateAsync({ amount, method: method ?? 'upi' });
      router.replace({
        pathname: '/fees/confirmation',
        params: {
          transactionId: result.transactionId,
          amount: String(amount),
          method: methodName ?? method,
          date: result.date,
          dateTime: result.dateTime ?? result.date,
          receiptNumber: result.receiptNumber,
          feeCategory: result.feeCategory,
          nextDueDate: result.nextDueDate,
          remainingDues: String(result.remainingDues ?? 0),
          status: result.status,
        },
      });
    } catch {
      Alert.alert('Payment Failed', 'Please try again');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScreenHeader title="Make Payment" />
      <View style={styles.content}>
        <View style={[styles.summary, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={{ color: theme.colors.textSecondary }}>Payment via {methodName}</Text>
          <Text style={[styles.amount, { color: theme.colors.primary }]}>{formatINR(amount)}</Text>
        </View>

        {method === 'upi' && (
          <Input label="UPI ID" placeholder="yourname@upi" value={upiId} onChangeText={setUpiId} icon="account-balance-wallet" />
        )}
        {method === 'card' && (
          <>
            <Input label="Card Number" placeholder="1234 5678 9012 3456" value={cardNumber} onChangeText={setCardNumber} icon="credit-card" keyboardType="numeric" />
            <View style={{ height: 16 }} />
            <Input label="CVV" placeholder="123" secureTextEntry icon="lock" keyboardType="numeric" />
          </>
        )}
        {method === 'netbanking' && (
          <Input label="Select Bank" placeholder="State Bank of India" icon="account-balance" />
        )}

        <Button title="PAY NOW" onPress={handlePay} loading={payment.isPending} style={{ marginTop: 32 }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, flex: 1 },
  summary: { padding: 20, borderRadius: 12, borderWidth: 1, alignItems: 'center', marginBottom: 24 },
  amount: { fontSize: 32, fontWeight: '800', marginTop: 8 },
});
