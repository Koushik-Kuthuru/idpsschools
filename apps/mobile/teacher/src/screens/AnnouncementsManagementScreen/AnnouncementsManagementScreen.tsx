import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton, AppHeader, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import type { Announcement, RootStackParamList } from '@/types';
import { textStyle } from '@/theme';
import { handleBottomNavPress } from '@/utils/navigationHelpers';
import { styles } from './AnnouncementsManagementScreen.styles';
import type { AnnouncementsManagementScreenProps } from './AnnouncementsManagementScreen.types';

export function AnnouncementsManagementScreen(_props: AnnouncementsManagementScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<Announcement[]>([]);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);

  const loadAnnouncements = useCallback(() => {
    mockApi.announcements.list().then(setItems);
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const handlePost = async () => {
    const text = draft.trim();
    if (!text) {
      Alert.alert('Missing text', 'Write your announcement before posting.');
      return;
    }
    setPosting(true);
    try {
      const created = await mockApi.announcements.create({ title: text });
      setItems((prev) => [created, ...prev]);
      setDraft('');
      Alert.alert('Posted', 'Your announcement was published successfully.');
    } catch {
      Alert.alert('Error', 'Could not post announcement. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <ScreenLayout
      scroll
      header={<AppHeader variant="back" title="Announcements" />}
      bottomNav={{
        activeTab: 'home',
        onTabPress: (tab) => handleBottomNavPress(navigation, tab),
      }}
    >
      <View style={styles.content}>
        <View style={styles.composer}>
          <Text style={[textStyle('labelLg'), styles.historyTitle]}>New announcement</Text>
          <TextInput
            style={[textStyle('bodyMd'), styles.composerInput]}
            placeholder="Write announcement..."
            placeholderTextColor="#6c7a71"
            value={draft}
            onChangeText={setDraft}
            multiline
            editable={!posting}
          />
          <AppButton
            label="Post"
            onPress={handlePost}
            loading={posting}
            disabled={!draft.trim() || posting}
            fullWidth={false}
          />
        </View>
        <Text style={[textStyle('headlineSm'), styles.historyTitle]}>History</Text>
        {items.length === 0 ? (
          <Text style={[textStyle('bodyMd'), styles.empty]}>No announcements yet.</Text>
        ) : (
          items.map((a) => (
            <View key={a.id} style={[styles.item, a.borderColor === 'error' && styles.itemUrgent]}>
              <Text style={[textStyle('bodyMd'), styles.itemTitle]}>{a.title}</Text>
              <Text style={[textStyle('timestamp11'), styles.itemTime]}>{a.timestamp}</Text>
            </View>
          ))
        )}
      </View>
    </ScreenLayout>
  );
}
