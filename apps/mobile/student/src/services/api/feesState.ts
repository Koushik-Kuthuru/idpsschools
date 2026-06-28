import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/config';
import type { FeesOverview, PaymentRecord } from '@/types';

export const BASE_FEES_OVERVIEW: FeesOverview = {
  totalFees: 0,
  paidAmount: 0,
  dueAmount: 0,
  dueDate: '',
  structure: [],
  recentPayments: [],
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
