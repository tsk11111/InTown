import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useChat } from '@/context/chat';
import { isEventPast, useEvents } from '@/context/events';
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
  const { user, joinedEventIds } = useAuth();
  const { getEvent } = useEvents();
  const { getMessages, sendMessage } = useChat();
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  const event = getEvent(id);
  const isPast = event ? isEventPast(event.date, event.time) : false;
  const isJoined = event ? joinedEventIds.includes(event.id) : false;
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

  if (!isJoined) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {event?.title ?? 'Event chat'}
            </Text>
          </View>
        </View>
        <View style={styles.guardWrap}>
          <Ionicons name="lock-closed-outline" size={44} color={colors.textTertiary} />
          <Text style={[styles.guardTitle, { color: colors.text }]}>Join to access chat</Text>
          <Text style={[styles.guardSub, { color: colors.textSecondary }]}>
            You need to join this event before you can view or send messages.
          </Text>
          <TouchableOpacity
            style={[styles.guardBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.replace({ pathname: '/event/[id]', params: { id } })}
            activeOpacity={0.85}
          >
            <Text style={styles.guardBtnText}>View event</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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

        {isPast ? (
          <View style={[styles.endedBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
            <Ionicons name="lock-closed-outline" size={14} color={colors.textTertiary} />
            <Text style={[styles.endedText, { color: colors.textTertiary }]}>Chat closed - this event has ended</Text>
          </View>
        ) : (
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
        )}
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
  endedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 0.5,
  },
  endedText: { fontSize: Theme.fontSize.sm },

  guardWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Theme.spacing.xl, gap: 12 },
  guardTitle: { fontSize: Theme.fontSize.xl, fontWeight: '700', textAlign: 'center' },
  guardSub: { fontSize: Theme.fontSize.base, textAlign: 'center', lineHeight: 22, maxWidth: 280 },
  guardBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: Theme.radius.lg,
  },
  guardBtnText: { color: '#fff', fontSize: Theme.fontSize.base, fontWeight: '600' },
});
