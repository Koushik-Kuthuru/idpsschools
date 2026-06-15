import { TextInputProps } from 'react-native';

export interface AppInputProps extends TextInputProps {
  label: string;
  icon?: string;
  error?: string;
  showPasswordToggle?: boolean;
}
