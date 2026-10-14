import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../lib/constants';
import type { ChatMessage } from '../../lib/types';

interface Props {
  message: ChatMessage;
  onSpeak?: (text: string) => void;
}

export default function ChatBubble({ message, onSpeak }: Props) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser && styles.rowUser]}>
      <View style={[styles.bubble, isUser ? styles.user : styles.assistant]}>
        <Text style={[styles.text, isUser && styles.textUser]}>{message.content}</Text>
      </View>
      {!isUser && onSpeak && (
        <TouchableOpacity onPress={() => onSpeak(message.content)} hitSlop={8}>
          <Ionicons name="volume-high-outline" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginBottom: 12, maxWidth: '88%' },
  rowUser: { alignSelf: 'flex-end' },
  bubble: { padding: 12, borderRadius: SIZES.radius, flexShrink: 1 },
  user: { backgroundColor: COLORS.text },
  assistant: { backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border },
  text: { fontSize: 15, lineHeight: 21, color: COLORS.text },
  textUser: { color: COLORS.background },
});
