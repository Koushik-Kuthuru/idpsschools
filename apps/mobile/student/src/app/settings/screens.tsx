import { ScrollView, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { STITCH_SCREEN_LIST } from '@/constants/stitchScreens';

export default function StitchScreensCatalog() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <ScreenHeader title="Stitch Screens" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
          All {STITCH_SCREEN_LIST.length} designs from stitch_splash_screen are registered below.
        </Text>
        {STITCH_SCREEN_LIST.map((screen) => (
          <TouchableOpacity
            key={screen.id}
            style={[styles.row, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => router.push(screen.route as '/assignments')}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: 14 }}>{screen.label}</Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 2 }}>{screen.id}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={theme.colors.textMuted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32 },
  hint: { fontSize: 13, marginBottom: 16, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
});
