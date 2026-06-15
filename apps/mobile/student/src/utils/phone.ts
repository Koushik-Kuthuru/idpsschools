import { Linking } from 'react-native';

export function openPhoneDialer(phone: string) {
  const tel = phone.replace(/[^\d+]/g, '');
  if (tel) Linking.openURL(`tel:${tel}`);
}
