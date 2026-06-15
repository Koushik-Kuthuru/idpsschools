import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store';

async function executeLogout(
  logout: () => Promise<void>,
  queryClient: ReturnType<typeof useQueryClient>,
  router: ReturnType<typeof useRouter>
) {
  await logout();
  queryClient.clear();
  router.replace('/(auth)/splash');
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);

  const signOut = () => executeLogout(logout, queryClient, router);

  const confirmSignOut = (message = 'Are you sure you want to logout?') => {
    if (Platform.OS === 'web') {
      if (typeof globalThis.confirm === 'function' && globalThis.confirm(message)) {
        void signOut();
      } else {
        void signOut();
      }
      return;
    }

    Alert.alert('Logout', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          void signOut();
        },
      },
    ]);
  };

  return { signOut, confirmSignOut };
}
