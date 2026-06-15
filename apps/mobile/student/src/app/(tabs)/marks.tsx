import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { MarksOverviewView } from '@/components/screens/MarksOverviewView';

/** Stitch: marks_overview_with_navigation */
export default function MarksTab() {
  const theme = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: `${theme.colors.primary}1a` }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Marks Overview</Text>
      </View>
      <MarksOverviewView showHeader={false} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
});
