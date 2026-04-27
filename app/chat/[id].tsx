import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useChat } from '@/context/chat';
import { useEvents } from '@/context/events';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { ChatMessage } from '@/context/chat';

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const h = d.getHours().toString().padStart(2, '0');
  const min = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${min}`;
}

function Bubble({
  msg,
  isOwn,
  showName,
  colors,
}: {
  msg: ChatMessage;
  isOwn: boolean;
  showName: boolean;
  colors: typeof Colors.light;
}) {
  return (
    <View style={[styles.bubbleWrap, isOwn ? styles.bubbleWrapOwn : styles.bubbleWrapOther]}>
      {!isOwn && showName && (
        <Text style={[styles.senderName, { color: colors.textTertiary }]}>{msg.userName}</Text>
      )}
      <View
        style={[
          styles.bubble,
          isOwn
            ? { backgroundColor: colors.primary }
            : { backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.bubbleText, { color: isOwn ? '#fff' : colors.text }]}>
          {msg.text}
        </Text>
      </View>
      <Text style={[styles.bubbleTime, { color: colors.textTertiary }]}>{formatTime(msg.timestamp)}</Text>
    </View>
  );
}

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { getEvent } = useEvents();
  const { getMessages, sendMessage } = useChat();
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  const event = getEvent(id);
  const messages = getMessages(id);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
    }
  }, []);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || !user) return;
    sendMessage(id, user.id, user.name, trimmed);
    setText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {event?.title ?? 'Event chat'}
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {messages.length} {messages.length === 1 ? 'message' : 'messages'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.messageList, { paddingBottom: 12 }]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="chatbubbles-outline" size={44} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No messages yet</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Be the first to say something!
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const isOwn = item.userId === user?.id;
            const prev = messages[index - 1];
            const showName = !isOwn && prev?.userId !== item.userId;
            return (
              <Bubble
                key={item.id}
                msg={item}
                isOwn={isOwn}
                showName={showName}
                colors={colors}
              />
            );
          }}
        />

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + 8,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text },
            ]}
            placeholder="Message…"
            placeholderTextColor={colors.textTertiary}
            value={text}
            onChangeText={setText}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: text.trim() ? colors.primary : colors.backgroundSecondary },
            ]}
            onPress={handleSend}
            activeOpacity={0.8}
            disabled={!text.trim()}
          >
            <Ionicons name="send" size={18} color={text.trim() ? '#fff' : colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: Theme.fontSize.base, fontWeight: '600' },
  headerSub: { fontSize: Theme.fontSize.xs, marginTop: 1 },

  messageList: { padding: Theme.spacing.md, gap: 4 },

  bubbleWrap: { marginVertical: 2, maxWidth: '78%' },
  bubbleWrapOwn: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleWrapOther: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  senderName: { fontSize: Theme.fontSize.xs, fontWeight: '600', marginBottom: 3, marginLeft: 4 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
  bubbleText: { fontSize: Theme.fontSize.base, lineHeight: 20 },
  bubbleTime: { fontSize: 10, marginTop: 3, marginHorizontal: 4 },

  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: Theme.fontSize.base, fontWeight: '600' },
  emptySub: { fontSize: Theme.fontSize.sm, textAlign: 'center' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 0.5,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: Theme.fontSize.base,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
