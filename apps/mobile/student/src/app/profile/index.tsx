import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StudentProfileView } from '@/components/screens/StudentProfileView';

/** Stitch: student_profile */
export default function StudentProfileScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <ScreenHeader
        title="My Profile"
        rightAction={
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        }
      />
      <StudentProfileView />
    </SafeAreaView>
  );
}
