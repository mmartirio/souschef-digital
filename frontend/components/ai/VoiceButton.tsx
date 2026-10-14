import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CookingPotAnimation from './CookingPotAnimation';
import { COLORS } from '../../lib/constants';
import type { AgentStatus } from '../../hooks/useVoiceAgent';

const LABELS: Record<AgentStatus, string> = {
  idle: 'Toque para conversar',
  listening: 'Ouvindo… pode falar',
  thinking: 'Pensando…',
  speaking: 'Falando…',
};

interface Props {
  status: AgentStatus;
  onPress: () => void;
  size?: number;
}

export default function VoiceButton({ status, onPress, size = 64 }: Props) {
  const active = status !== 'idle';

  return (
    <View style={styles.container}>
      {status === 'thinking' ? (
        // Enquanto prepara a resposta, a panela animada substitui o botão (tocar continua encerrando).
        <TouchableOpacity onPress={onPress} style={{ height: size, justifyContent: 'center' }}>
          <CookingPotAnimation width={size * 1.3} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={onPress}
          style={[styles.button, { width: size, height: size, borderRadius: size / 2 }, active && styles.active]}
        >
          <Ionicons name={active ? 'stop' : 'mic'} size={size / 2.4} color={COLORS.background} />
        </TouchableOpacity>
      )}
      <Text style={styles.label}>{LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 6 },
  button: { backgroundColor: COLORS.text, justifyContent: 'center', alignItems: 'center' },
  active: { backgroundColor: COLORS.error },
  label: { fontSize: 12, color: COLORS.textSecondary },
});
