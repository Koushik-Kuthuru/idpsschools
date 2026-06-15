import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { MarksOverviewView } from '@/components/screens/MarksOverviewView';

/** Stitch: marks_overview (stack, no tab bar) */
export default function MarksOverviewScreen() {
  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <ScreenHeader title="MARKS" />
      <MarksOverviewView showHeader />
    </SafeAreaView>
  );
}
