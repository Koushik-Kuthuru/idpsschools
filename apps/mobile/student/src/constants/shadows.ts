import { Platform } from 'react-native';

export const cardShadow =
  Platform.OS === 'web'
    ? ({ boxShadow: '0 4px 16px rgba(20, 72, 53, 0.08)' } as const)
    : Platform.OS === 'ios'
      ? {
          shadowColor: '#144835',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        }
      : { elevation: 3 };

export const subtleShadow =
  Platform.OS === 'web'
    ? ({ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' } as const)
    : Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
        }
      : { elevation: 2 };

export const buttonShadow =
  Platform.OS === 'web'
    ? ({ boxShadow: '0 4px 8px rgba(15, 189, 131, 0.2)' } as const)
    : Platform.OS === 'ios'
      ? {
          shadowColor: '#0fbd83',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        }
      : { elevation: 4 };

export const tabBarShadow =
  Platform.OS === 'web'
    ? ({ boxShadow: '0 -4px 20px rgba(20, 72, 53, 0.08)' } as const)
    : Platform.OS === 'ios'
      ? {
          shadowColor: '#144835',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        }
      : { elevation: 12 };

export const quickAccessShadow =
  Platform.OS === 'web'
    ? ({ boxShadow: '0 2px 10px rgba(20, 72, 53, 0.06)' } as const)
    : Platform.OS === 'ios'
      ? {
          shadowColor: '#144835',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        }
      : { elevation: 2 };
