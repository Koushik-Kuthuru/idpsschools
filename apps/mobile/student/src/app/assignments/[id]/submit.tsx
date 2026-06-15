import { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useSubmitAssignment } from '@/hooks/useApi';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';

export default function AssignmentSubmitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const submit = useSubmitAssignment();
  const [file, setFile] = useState<{ uri: string; name: string } | null>(null);

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (!result.canceled && result.assets[0]) {
      setFile({ uri: result.assets[0].uri, name: result.assets[0].name });
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setFile({ uri: result.assets[0].uri, name: 'submission.jpg' });
    }
  };

  const handleSubmit = async () => {
    if (!file || !id) {
      Alert.alert('No file', 'Please select a file to upload');
      return;
    }
    try {
      await submit.mutateAsync({ id, uri: file.uri, name: file.name });
      Alert.alert('Success', 'Assignment submitted successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to submit assignment');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScreenHeader title="Submit Assignment" />
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Upload your work</Text>
        <Text style={{ color: theme.colors.textSecondary, marginBottom: 24 }}>
          Supported formats: PDF, Images (JPG, PNG)
        </Text>

        <View style={styles.uploadOptions}>
          <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} onPress={pickDocument}>
            <MaterialIcons name="picture-as-pdf" size={32} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.text, fontWeight: '600', marginTop: 8 }}>PDF Upload</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} onPress={pickImage}>
            <MaterialIcons name="image" size={32} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.text, fontWeight: '600', marginTop: 8 }}>Image Upload</Text>
          </TouchableOpacity>
        </View>

        {file && (
          <View style={[styles.filePreview, { backgroundColor: `${theme.colors.primary}1a`, borderColor: `${theme.colors.primary}33` }]}>
            <MaterialIcons name="attach-file" size={20} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.text, flex: 1, marginLeft: 8 }} numberOfLines={1}>{file.name}</Text>
            <TouchableOpacity onPress={() => setFile(null)}>
              <MaterialIcons name="close" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        <Button title="SUBMIT" onPress={handleSubmit} loading={submit.isPending} style={{ marginTop: 32 }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, flex: 1 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  uploadOptions: { flexDirection: 'row', gap: 16 },
  uploadBtn: { flex: 1, alignItems: 'center', padding: 24, borderRadius: 12, borderWidth: 1 },
  filePreview: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginTop: 24 },
});
