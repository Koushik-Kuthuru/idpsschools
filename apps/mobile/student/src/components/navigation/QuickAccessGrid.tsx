import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { QUICK_ACCESS_ITEMS } from '@/constants/quickAccess';

export function QuickAccessGrid() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={styles.grid}>
      {QUICK_ACCESS_ITEMS.map((item) => (
        <TouchableOpacity
          key={item.label}
          style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={() => router.push(item.route)}
        >
          <MaterialIcons name={item.icon} size={24} color={theme.colors.primary} />
          <Text style={[styles.label, { color: theme.colors.text }]} numberOfLines={2}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '47%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 88,
    paddingHorizontal: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 16,
  },
});
