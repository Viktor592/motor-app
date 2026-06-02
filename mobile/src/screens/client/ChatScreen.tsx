import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { sendMessage, fetchMessages, addMessage } from '../../store/slices/chatSlice';
import { AppDispatch, RootState } from '../../store';
import { Colors, Spacing, Radius } from '../../theme';
import { getSocket, joinOrder } from '../../services/socket';

interface Props {
  route?: { params?: { orderId?: string } };
}

export default function ChatScreen({ route }: Props) {
  const orderId = route?.params?.orderId;
  const dispatch = useDispatch<AppDispatch>();
  const { messages, sending, loading } = useSelector((s: RootState) => s.chat);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (orderId) {
      dispatch(fetchMessages(orderId));
      joinOrder(orderId);
      // Слушать входящие сообщения
      const socket = getSocket();
      socket?.on('chat:message', (msg: any) => dispatch(addMessage(msg)));
      return () => { socket?.off('chat:message'); };
    }
  }, [orderId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setText('');
    dispatch(sendMessage({ message: trimmed, orderId }));
  };

  const renderItem = ({ item }: { item: typeof messages[0] }) => {
    const isUser = item.role === 'USER';
    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AI</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
            {item.content}
          </Text>
          <Text style={styles.bubbleTime}>
            {new Date(item.createdAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.agentDot} />
        <View>
          <Text style={styles.agentName}>Агент «Приёмщик»</Text>
          <Text style={styles.agentStatus}>● Онлайн · Powered by Claude AI</Text>
        </View>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.ore} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>Агент готов к работе</Text>
              <Text style={styles.emptyHint}>
                Опишите проблему с автомобилем — я помогу разобраться и записаться к нужному специалисту.
              </Text>
            </View>
          }
        />
      )}

      {/* Typing indicator */}
      {sending && (
        <View style={styles.typingRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>AI</Text></View>
          <View style={[styles.bubble, styles.bubbleAI, styles.typingBubble]}>
            <Text style={styles.typingText}>Обрабатывает…</Text>
          </View>
        </View>
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Опишите проблему…"
            placeholderTextColor={Colors.dust}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
            activeOpacity={0.8}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.void },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.plate2, borderBottomWidth: 1,
    borderBottomColor: Colors.wire, padding: Spacing.md,
  },
  agentDot: {
    width: 10, height: 10, borderRadius: 99,
    backgroundColor: Colors.ore,
    shadowColor: Colors.ore, shadowOpacity: 0.8, shadowRadius: 6,
  },
  agentName:   { color: Colors.chalk, fontSize: 15, fontWeight: '800' },
  agentStatus: { color: Colors.ore,   fontSize: 10, letterSpacing: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: Spacing.md, paddingBottom: Spacing.lg },
  msgRow:     { flexDirection: 'row', alignItems: 'flex-end', marginBottom: Spacing.sm, gap: Spacing.xs },
  msgRowUser: { flexDirection: 'row-reverse' },
  avatar: {
    width: 28, height: 28, borderRadius: 99,
    backgroundColor: Colors.ore, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#000', fontSize: 9, fontWeight: '900' },
  bubble: {
    maxWidth: '75%', borderRadius: Radius.md,
    padding: Spacing.sm, paddingHorizontal: Spacing.md,
  },
  bubbleAI:   { backgroundColor: Colors.plate, borderWidth: 1, borderColor: Colors.wire },
  bubbleUser: { backgroundColor: Colors.ore },
  bubbleText: { color: Colors.ash, fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: '#000' },
  bubbleTime: { color: Colors.dust, fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  typingRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, padding: Spacing.md },
  typingBubble: { paddingVertical: Spacing.xs },
  typingText: { color: Colors.dust, fontSize: 13 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, marginTop: 60 },
  emptyTitle: { color: Colors.chalk, fontSize: 18, fontWeight: '800', marginBottom: Spacing.sm },
  emptyHint:  { color: Colors.dust,  fontSize: 13, lineHeight: 20, textAlign: 'center' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    backgroundColor: Colors.plate2, borderTopWidth: 1,
    borderTopColor: Colors.wire, padding: Spacing.sm,
  },
  input: {
    flex: 1, backgroundColor: Colors.plate,
    borderWidth: 1, borderColor: Colors.wire,
    borderRadius: Radius.md, padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    color: Colors.chalk, fontSize: 14,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: Radius.sm,
    backgroundColor: Colors.ore, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { color: '#000', fontSize: 18, fontWeight: '900' },
});
