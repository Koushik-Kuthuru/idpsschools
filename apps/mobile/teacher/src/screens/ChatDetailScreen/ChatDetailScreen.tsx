import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader, AppIcon } from '@/components';
import { mockApi } from '@/services/api';
import { colors, textStyle } from '@/theme';
import { styles } from './ChatDetailScreen.styles';
import type { ChatDetailScreenProps } from './ChatDetailScreen.types';

type ChatMessage = { id: string; text: string; sent: boolean; time: string };

export function ChatDetailScreen({ route }: ChatDetailScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [title, setTitle] = useState('Chat');

  useEffect(() => {
    mockApi.messages.getConversation(route.params.conversationId).then((data) => {
      setMessages(data.messages);
      setTitle(data.thread?.name ?? 'Chat');
    });
  }, [route.params.conversationId]);

  const send = () => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { id: Date.now().toString(), text, sent: true, time: 'Now' }]);
    setText('');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <AppHeader variant="back" title={title} showBack />
      <FlatList
        style={styles.messages}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <View style={item.sent ? styles.bubbleSent : styles.bubbleReceived}>
            <Text style={[textStyle('bodyMd'), item.sent ? styles.bubbleTextSent : styles.bubbleTextReceived]}>
              {item.text}
            </Text>
            <Text style={[textStyle('timestamp11'), styles.bubbleTime]}>{item.time}</Text>
          </View>
        )}
      />
      <View style={styles.inputBar}>
        <TextInput style={[textStyle('bodyMd'), styles.input]} value={text} onChangeText={setText} placeholder="Type a message..." />
        <TouchableOpacity onPress={send}>
          <AppIcon name="send" color={colors.primaryContainer} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
