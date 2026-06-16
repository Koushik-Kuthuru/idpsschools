import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { MarksOverviewView } from '@/components/screens/MarksOverviewView';

export default function MarksScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
      <ScreenHeader title="Marks" fallbackRoute="/(tabs)/profile" />
      <View style={{ flex: 1 }}>
        <MarksOverviewView showHeader={false} />
      </View>
    </SafeAreaView>
  );
}
