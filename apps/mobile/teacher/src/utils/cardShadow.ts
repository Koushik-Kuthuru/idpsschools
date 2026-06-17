import { Platform } from 'react-native';

export const cardShadow =
  Platform.OS === 'web'
    ? ({ boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)' } as const)
    : Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 10,
        }
      : { elevation: 2 };
