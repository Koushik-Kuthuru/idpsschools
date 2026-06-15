import React, { useEffect, useMemo, useState } from 'react';
import { View, TextInput, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader, MessageCard, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import type { MessageThread, RootStackParamList } from '@/types';
import { textStyle } from '@/theme';
import { handleBottomNavPress } from '@/utils/navigationHelpers';
import { styles } from './MessagesListScreen.styles';
import type { MessagesListScreenProps } from './MessagesListScreen.types';

export function MessagesListScreen(_props: MessagesListScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    mockApi.messages.list().then(setThreads);
  }, []);

  const filtered = useMemo(
    () => threads.filter((t) => t.name.toLowerCase().includes(query.toLowerCase())),
    [threads, query],
  );

  return (
    <ScreenLayout
      scroll
      header={<AppHeader variant="back" title="Messages" />}
      bottomNav={{
        activeTab: 'home',
        onTabPress: (tab) => handleBottomNavPress(navigation, tab),
      }}
    >
      <View style={styles.content}>
        <TextInput
          style={[textStyle('bodyMd'), styles.search]}
          placeholder="Search conversations..."
          value={query}
          onChangeText={setQuery}
        />
        <FlatList
          data={filtered}
          keyExtractor={(t) => t.id}
          scrollEnabled={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <MessageCard
              name={item.name}
              role={item.role}
              lastMessage={item.lastMessage}
              timestamp={item.timestamp}
              avatarUrl={item.avatarUrl}
              unread={item.unread}
              onPress={() => navigation.navigate('ChatDetail', { conversationId: item.id })}
            />
          )}
        />
      </View>
    </ScreenLayout>
  );
}
