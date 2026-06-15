import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/config';
import type { FeesOverview, PaymentRecord } from '@/types';

export const BASE_FEES_OVERVIEW: FeesOverview = {
  totalFees: 5000,
  paidAmount: 2350,
  dueAmount: 2650,
  dueDate: 'Jan 20, 2026',
  structure: [
    { label: 'Tuition Fees', amount: 1800 },
    { label: 'Sports & Activities', amount: 300 },
    { label: 'Transport Facility', amount: 150 },
    { label: 'Miscellaneous', amount: 400 },
  ],
  recentPayments: [
    {
      id: '1',
      period: 'December 2025',
      paidOn: 'Dec 15, 2025',
      amount: 2400,
      status: 'success',
      transactionId: 'TXN20251215001',
      receiptNumber: 'RCP-2025-1201',
      method: 'UPI',
      dateTime: 'Dec 15, 2025 | 10:30 AM',
    },
    {
      id: '2',
      period: 'November 2025',
      paidOn: 'Nov 15, 2025',
      amount: 2400,
      status: 'success',
      transactionId: 'TXN20251115001',
      receiptNumber: 'RCP-2025-1101',
      method: 'Credit Card',
      dateTime: 'Nov 15, 2025 | 2:15 PM',
    },
    {
      id: '3',
      period: 'October 2025',
      paidOn: 'Oct 15, 2025',
      amount: 2400,
      status: 'success',
      transactionId: 'TXN20251015001',
      receiptNumber: 'RCP-2025-1001',
      method: 'Net Banking',
      dateTime: 'Oct 15, 2025 | 11:00 AM',
    },
    {
      id: '4',
      period: 'September 2025',
      paidOn: 'Sep 15, 2025',
      amount: 2400,
      status: 'success',
      transactionId: 'TXN20250915001',
      receiptNumber: 'RCP-2025-0901',
      method: 'UPI',
      dateTime: 'Sep 15, 2025 | 9:45 AM',
    },
    {
      id: '5',
      period: 'August 2025',
      paidOn: 'Aug 15, 2025',
      amount: 2400,
      status: 'success',
      transactionId: 'TXN20250815001',
      receiptNumber: 'RCP-2025-0801',
      method: 'Debit Card',
      dateTime: 'Aug 15, 2025 | 4:20 PM',
    },
  ],
};

export interface FeesPersistedState {
  paidAmount: number;
  dueAmount: number;
  recentPayments: PaymentRecord[];
}

export function mergeFeesOverview(base: FeesOverview, persisted: FeesPersistedState | null): FeesOverview {
  if (!persisted) return base;
  return {
    ...base,
    paidAmount: persisted.paidAmount,
    dueAmount: persisted.dueAmount,
    recentPayments: persisted.recentPayments,
  };
}

export async function getFeesPersistedState(): Promise<FeesPersistedState | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.FEES_STATE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FeesPersistedState;
  } catch {
    return null;
  }
}

export async function getMergedFeesOverview(): Promise<FeesOverview> {
  const persisted = await getFeesPersistedState();
  return mergeFeesOverview(BASE_FEES_OVERVIEW, persisted);
}

export async function applyFeesPayment(
  amount: number,
  method: string,
): Promise<{ state: FeesPersistedState; payment: PaymentRecord }> {
  const current = await getMergedFeesOverview();
  const now = new Date();
  const paidOn = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const periodLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const transactionId = `TXN${Date.now()}`;

  const payment: PaymentRecord = {
    id: `pay_${Date.now()}`,
    period: `Fee Payment — ${periodLabel}`,
    paidOn,
    amount,
    status: 'success',
    transactionId,
    receiptNumber: `RCP-${now.getFullYear()}-${String(now.getTime()).slice(-4)}`,
    method,
    dateTime: `${paidOn} | ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
  };

  const state: FeesPersistedState = {
    paidAmount: current.paidAmount + amount,
    dueAmount: Math.max(0, current.dueAmount - amount),
    recentPayments: [payment, ...current.recentPayments],
  };

  await AsyncStorage.setItem(STORAGE_KEYS.FEES_STATE, JSON.stringify(state));
  return { state, payment };
}
